import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";

type ScheduleRow = {
  id: string;
  community: string;
  weekday: string;
  pass_time: string;
};

type PushTokenRow = {
  id: string;
  fcm_token: string;
};

type DispatcherRequestBody = {
  source?: string;
  target_iso?: string;
};

type ScheduleDispatchSummary = {
  schedule_id: string;
  community: string;
  pass_time: string;
  matched_hhmm?: string;
  status: "sent" | "duplicate" | "no_tokens";
  recipients_count: number;
  success_count: number;
  failure_count: number;
};

type DispatcherRunStatus = "no_matching_schedules" | "finished" | "error";

type DispatcherSummary = {
  source: string;
  time_zone: string;
  target: {
    weekday: string;
    hhmm: string;
    date: string;
    match_window_minutes: number;
    candidate_hhmms: string[];
  };
  target_iso: string;
  active_schedules_same_weekday: number;
  matching_schedules: number;
  duplicate_schedules: number;
  schedules_without_tokens: number;
  firebase_auth_requested: boolean;
  fcm_send_attempts: number;
  dispatched: number;
  success: number;
  failed: number;
  details: ScheduleDispatchSummary[];
  message?: string;
};

const LOG_PREFIX = "[garbage-collection-push-dispatcher]";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function normalizeHhmm(value: string) {
  return value.slice(0, 5);
}

function readMatchWindowMinutes() {
  const value = Number(Deno.env.get("GARBAGE_COLLECTION_MATCH_WINDOW_MINUTES"));

  if (!Number.isFinite(value) || value < 0) return 2;

  return Math.min(Math.trunc(value), 10);
}

function base64UrlEncode(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}

async function importPrivateKey(privateKey: string) {
  const pem = normalizePrivateKey(privateKey)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binary = atob(pem);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
}

async function getGoogleAccessToken() {
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY não configurados.",
    );
  }

  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(claimSet),
  )}`;

  const key = await importPrivateKey(privateKey);

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJwt),
  );

  const jwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(`Falha ao autenticar no Google OAuth: ${details}`);
  }

  const data = await response.json();

  return data.access_token as string;
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const byType = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const weekdayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(byType.weekday);

  return {
    weekday: WEEKDAYS[weekdayIndex],
    hhmm: `${byType.hour}:${byType.minute}`,
    date: `${byType.year}-${byType.month}-${byType.day}`,
  };
}

function getMatchingTargets(
  targetInstant: Date,
  timeZone: string,
  windowMinutes: number,
) {
  const targets = new Map<string, ReturnType<typeof getZonedParts>>();

  for (let offset = -windowMinutes; offset <= 0; offset += 1) {
    const candidate = getZonedParts(
      new Date(targetInstant.getTime() + offset * 60 * 1000),
      timeZone,
    );

    targets.set(`${candidate.weekday}|${candidate.hhmm}`, candidate);
  }

  return targets;
}

async function recordDispatcherRun(
  admin: ReturnType<typeof createClient>,
  summary: DispatcherSummary,
  status: DispatcherRunStatus,
  message?: string,
) {
  try {
    const payload = {
      source: summary.source,
      status,
      time_zone: summary.time_zone,
      target: summary.target,
      target_iso: summary.target_iso,
      active_schedules_same_weekday: summary.active_schedules_same_weekday,
      matching_schedules: summary.matching_schedules,
      duplicate_schedules: summary.duplicate_schedules,
      schedules_without_tokens: summary.schedules_without_tokens,
      firebase_auth_requested: summary.firebase_auth_requested,
      fcm_send_attempts: summary.fcm_send_attempts,
      dispatched: summary.dispatched,
      success: summary.success,
      failed: summary.failed,
      details: summary.details,
      message: message ?? summary.message ?? null,
    };

    const { error } = await admin
      .from("garbage_collection_dispatcher_runs")
      .insert(payload);

    if (error) {
      log("dispatcher-run-log-error", error.message);
    }
  } catch (error) {
    log(
      "dispatcher-run-log-error",
      error instanceof Error ? error.message : error,
    );
  }
}

async function readRequestBody(req: Request) {
  try {
    return (await req.json()) as DispatcherRequestBody;
  } catch {
    return {};
  }
}

async function sendFcmMessage(
  accessToken: string,
  projectId: string,
  token: string,
  schedule: ScheduleRow,
) {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: "Coleta de lixo em 10 minutos",
            body: `A coleta da comunidade está prevista para ${normalizeHhmm(schedule.pass_time)}.`,
          },
          data: {
            type: "garbage_collection_reminder",
            schedule_id: schedule.id,
            community: schedule.community,
          },
          android: {
            priority: "high",
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          webpush: {
            fcm_options: {
              link: "/garbage-schedules",
            },
          },
        },
      }),
    },
  );

  const responseText = await response.text();

  return {
    ok: response.ok,
    details: responseText,
  };
}

serve(async (req) => {
  const cors = handleCors(req);

  if (cors) return cors;

  if (req.method !== "POST") {
    return json(405, {
      error: "Método não permitido.",
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID");

  const timeZone =
    Deno.env.get("GARBAGE_COLLECTION_TIMEZONE") || "America/Sao_Paulo";

  if (!supabaseUrl || !serviceRoleKey || !firebaseProjectId) {
    return json(500, {
      error: "Variáveis do dispatcher não configuradas.",
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  let responseSummary: DispatcherSummary | null = null;

  try {
    const body = await readRequestBody(req);

    const targetInstant = body.target_iso
      ? new Date(body.target_iso)
      : new Date(Date.now() + 10 * 60 * 1000);

    if (Number.isNaN(targetInstant.getTime())) {
      return json(400, {
        error: "target_iso inválido. Use uma data ISO válida.",
      });
    }

    const matchWindowMinutes = readMatchWindowMinutes();

    const target = getZonedParts(targetInstant, timeZone);

    const matchingTargets = getMatchingTargets(
      targetInstant,
      timeZone,
      matchWindowMinutes,
    );

    const candidateHhmms = Array.from(
      new Set(Array.from(matchingTargets.values()).map((item) => item.hhmm)),
    ).sort();

    responseSummary = {
      source: body.source ?? "unknown",
      time_zone: timeZone,
      target: {
        ...target,
        match_window_minutes: matchWindowMinutes,
        candidate_hhmms: candidateHhmms,
      },
      target_iso: targetInstant.toISOString(),
      active_schedules_same_weekday: 0,
      matching_schedules: 0,
      duplicate_schedules: 0,
      schedules_without_tokens: 0,
      firebase_auth_requested: false,
      fcm_send_attempts: 0,
      dispatched: 0,
      success: 0,
      failed: 0,
      details: [],
    };

    log("start", responseSummary);

    const targetWeekdays = Array.from(
      new Set(Array.from(matchingTargets.values()).map((item) => item.weekday)),
    );

    const { data: schedulesData, error: schedulesError } = await admin
      .from("garbage_collection_schedules")
      .select(
        `
          id,
          community,
          weekday,
          pass_time
        `,
      )
      .eq("is_active", true)
      .in("weekday", targetWeekdays);

    if (schedulesError) {
      throw schedulesError;
    }

    responseSummary.active_schedules_same_weekday =
      schedulesData?.filter((schedule) => schedule.weekday === target.weekday)
        .length ?? 0;

    const schedules = ((schedulesData ?? []) as ScheduleRow[])
      .map((schedule) => {
        const normalizedPassTime = normalizeHhmm(schedule.pass_time);

        return {
          schedule,
          matchedTarget: matchingTargets.get(
            `${schedule.weekday}|${normalizedPassTime}`,
          ),
        };
      })
      .filter(
        (
          item,
        ): item is {
          schedule: ScheduleRow;
          matchedTarget: ReturnType<typeof getZonedParts>;
        } => Boolean(item.matchedTarget),
      );

    responseSummary.matching_schedules = schedules.length;

    if (!schedules.length) {
      const message = "Nenhum horário ativo encontrado.";

      responseSummary.message = message;

      await recordDispatcherRun(
        admin,
        responseSummary,
        "no_matching_schedules",
        message,
      );

      return json(200, {
        ...responseSummary,
        message,
      });
    }

    let accessToken = "";

    for (const { schedule, matchedTarget } of schedules) {
      const normalizedPassTime = normalizeHhmm(schedule.pass_time);

      /**
       * IDMPOTÊNCIA REAL
       *
       * schedule_id + date + hh:mm
       */

      const { data: insertedLog, error: insertedLogError } = await admin
        .from("garbage_collection_notification_logs")
        .insert({
          schedule_id: schedule.id,
          community: schedule.community,
          target_occurrence_date: matchedTarget.date,
          target_occurrence_time: normalizedPassTime,
          notification_type: "ten_minutes_before",
        })
        .select("id")
        .single();

      if (insertedLogError) {
        if (insertedLogError.code === "23505") {
          responseSummary.duplicate_schedules += 1;

          responseSummary.details.push({
            schedule_id: schedule.id,
            community: schedule.community,
            pass_time: normalizedPassTime,
            matched_hhmm: matchedTarget.hhmm,
            status: "duplicate",
            recipients_count: 0,
            success_count: 0,
            failure_count: 0,
          });

          continue;
        }

        log("duplicate-detected", {
          scheduleId: schedule.id,
          error: insertedLogError?.message,
        });

        throw insertedLogError;
      }

      const { data: tokensData, error: tokensError } = await admin
        .from("user_push_tokens")
        .select("id, fcm_token")
        .eq("community", schedule.community)
        .eq("enabled", true);

      if (tokensError) {
        throw tokensError;
      }

      const tokens = (tokensData ?? []) as PushTokenRow[];

      if (!tokens.length) {
        responseSummary.schedules_without_tokens += 1;

        responseSummary.details.push({
          schedule_id: schedule.id,
          community: schedule.community,
          pass_time: normalizedPassTime,
          matched_hhmm: matchedTarget.hhmm,
          status: "no_tokens",
          recipients_count: 0,
          success_count: 0,
          failure_count: 0,
        });

        continue;
      }

      if (!accessToken) {
        responseSummary.firebase_auth_requested = true;

        accessToken = await getGoogleAccessToken();
      }

      let scheduleSuccess = 0;
      let scheduleFailed = 0;

      for (const token of tokens) {
        responseSummary.fcm_send_attempts += 1;

        const result = await sendFcmMessage(
          accessToken,
          firebaseProjectId,
          token.fcm_token,
          schedule,
        );

        if (result.ok) {
          scheduleSuccess += 1;
        } else {
          scheduleFailed += 1;

          log("fcm-send-error", {
            scheduleId: schedule.id,
            tokenId: token.id,
            details: result.details,
          });

          /**
           * TOKEN INVÁLIDO
           */

          if (
            result.details.includes("UNREGISTERED") ||
            result.details.includes("INVALID_ARGUMENT") ||
            result.details.includes("registration-token-not-registered")
          ) {
            await admin
              .from("user_push_tokens")
              .update({
                enabled: false,
                disabled_at: new Date().toISOString(),
              })
              .eq("id", token.id);
          }
        }
      }

      await admin
        .from("garbage_collection_notification_logs")
        .update({
          recipients_count: tokens.length,
          success_count: scheduleSuccess,
          failure_count: scheduleFailed,
        })
        .eq("id", insertedLog.id);

      responseSummary.dispatched += 1;

      responseSummary.success += scheduleSuccess;

      responseSummary.failed += scheduleFailed;

      responseSummary.details.push({
        schedule_id: schedule.id,
        community: schedule.community,
        pass_time: normalizedPassTime,
        matched_hhmm: matchedTarget.hhmm,
        status: "sent",
        recipients_count: tokens.length,
        success_count: scheduleSuccess,
        failure_count: scheduleFailed,
      });
    }

    responseSummary.message = "Dispatcher finalizado.";

    log("finish", responseSummary);

    await recordDispatcherRun(
      admin,
      responseSummary,
      "finished",
      responseSummary.message,
    );

    return json(200, responseSummary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao enviar notificações.";

    log("error", message);

    if (responseSummary) {
      responseSummary.message = message;

      await recordDispatcherRun(admin, responseSummary, "error", message);
    }

    return json(500, {
      error: message,
    });
  }
});
