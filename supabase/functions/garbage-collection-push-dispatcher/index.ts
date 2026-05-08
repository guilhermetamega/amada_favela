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
  status: "sent" | "duplicate" | "no_tokens";
  recipients_count: number;
  success_count: number;
  failure_count: number;
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

function base64UrlEncode(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

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
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
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
  const header = { alg: "RS256", typ: "JWT" };
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
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
    hour12: false,
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

async function readRequestBody(req: Request) {
  try {
    return (await req.json()) as DispatcherRequestBody;
  } catch {
    return {} as DispatcherRequestBody;
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
            body: `A coleta da comunidade está prevista para ${schedule.pass_time.slice(0, 5)}.`,
          },
          data: {
            type: "garbage_collection_reminder",
            schedule_id: schedule.id,
            community: schedule.community,
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

  if (!response.ok) {
    return { ok: false, details: await response.text() };
  }

  return { ok: true, details: await response.text() };
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID");
  const timeZone =
    Deno.env.get("GARBAGE_COLLECTION_TIMEZONE") || "America/Sao_Paulo";

  if (!supabaseUrl || !serviceRoleKey || !firebaseProjectId) {
    return json(500, { error: "Variáveis do dispatcher não configuradas." });
  }

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

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const target = getZonedParts(targetInstant, timeZone);
    const responseSummary = {
      source: body.source ?? "unknown",
      time_zone: timeZone,
      target,
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
      details: [] as ScheduleDispatchSummary[],
    };

    log("start", responseSummary);

    const { data: schedulesData, error: schedulesError } = await admin
      .from("garbage_collection_schedules")
      .select("id, community, weekday, pass_time")
      .eq("is_active", true)
      .eq("weekday", target.weekday);

    if (schedulesError) throw schedulesError;

    responseSummary.active_schedules_same_weekday = schedulesData?.length ?? 0;

    const schedules = ((schedulesData ?? []) as ScheduleRow[]).filter(
      (schedule) => schedule.pass_time.startsWith(target.hhmm),
    );

    responseSummary.matching_schedules = schedules.length;

    if (!schedules.length) {
      log("no-matching-schedules", {
        target,
        timeZone,
        activeSchedulesSameWeekday:
          responseSummary.active_schedules_same_weekday,
      });

      return json(200, {
        ...responseSummary,
        message:
          "Nenhum horário ativo bateu com o alvo calculado. Confira o timezone GARBAGE_COLLECTION_TIMEZONE e se existe coleta exatamente nesse HH:mm.",
      });
    }

    let accessToken = "";

    for (const schedule of schedules) {
      const { data: insertedLog, error: logError } = await admin
        .from("garbage_collection_notification_logs")
        .insert({
          schedule_id: schedule.id,
          community: schedule.community,
          target_occurrence_date: target.date,
          target_occurrence_time: schedule.pass_time,
          notification_type: "ten_minutes_before",
        })
        .select("id")
        .single();

      if (logError || !insertedLog) {
        responseSummary.duplicate_schedules += 1;
        responseSummary.details.push({
          schedule_id: schedule.id,
          community: schedule.community,
          pass_time: schedule.pass_time,
          status: "duplicate",
          recipients_count: 0,
          success_count: 0,
          failure_count: 0,
        });
        log("skip-duplicate-or-log-error", {
          scheduleId: schedule.id,
          error: logError?.message,
        });
        continue;
      }

      const { data: tokensData, error: tokensError } = await admin
        .from("user_push_tokens")
        .select("id, fcm_token")
        .eq("community", schedule.community)
        .eq("enabled", true);

      if (tokensError) throw tokensError;

      const tokens = (tokensData ?? []) as PushTokenRow[];

      if (!tokens.length) {
        responseSummary.schedules_without_tokens += 1;
        responseSummary.details.push({
          schedule_id: schedule.id,
          community: schedule.community,
          pass_time: schedule.pass_time,
          status: "no_tokens",
          recipients_count: 0,
          success_count: 0,
          failure_count: 0,
        });
        log("skip-no-tokens", {
          scheduleId: schedule.id,
          community: schedule.community,
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

          if (
            result.details.includes("UNREGISTERED") ||
            result.details.includes("INVALID_ARGUMENT")
          ) {
            await admin
              .from("user_push_tokens")
              .update({ enabled: false, disabled_at: new Date().toISOString() })
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
        pass_time: schedule.pass_time,
        status: "sent",
        recipients_count: tokens.length,
        success_count: scheduleSuccess,
        failure_count: scheduleFailed,
      });
    }

    log("finish", responseSummary);

    return json(200, responseSummary);
  } catch (error) {
    log("error", error instanceof Error ? error.message : error);

    return json(500, {
      error:
        error instanceof Error ? error.message : "Erro ao enviar notificações.",
    });
  }
});
