import { createClient } from "@supabase/supabase-js";

type MailPushCandidateRow = {
  phone_digits: string;
  community: string;
  pending_mail_count: number;
  oldest_mail_at: string;
  latest_mail_at: string;
  nearest_expires_at: string;
  mail_ids: string[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getSupabaseServiceKey() {
  const legacyServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (legacyServiceRoleKey) {
    return legacyServiceRoleKey;
  }

  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (!secretKeysRaw) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEYS ausente.",
    );
  }

  const secretKeys = JSON.parse(secretKeysRaw) as Record<string, string>;
  const defaultSecretKey = secretKeys.default ?? Object.values(secretKeys)[0];

  if (!defaultSecretKey) {
    throw new Error("Nenhuma secret key encontrada em SUPABASE_SECRET_KEYS.");
  }

  return defaultSecretKey;
}

function normalizeBrazilPhoneForMatch(value: string) {
  let digits = value.replace(/\D/g, "");

  if (
    digits.startsWith("55") &&
    (digits.length === 12 || digits.length === 13)
  ) {
    digits = digits.slice(2);
  }

  return digits;
}

async function hmacSha256Hex(message: string, secret: string) {
  const encoder = new TextEncoder();

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getNotificationBody(count: number) {
  if (count === 1) {
    return "Você possui uma correspondência disponível na associação.";
  }

  return `Você possui ${count} correspondências disponíveis na associação.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "GET") {
    return jsonResponse(
      {
        ok: false,
        error: "Método não permitido.",
      },
      405,
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const matchSecret = Deno.env.get("AMA_MAIL_MATCH_SECRET");

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL não configurada.");
    }

    if (!matchSecret) {
      throw new Error("AMA_MAIL_MATCH_SECRET não configurada.");
    }

    const supabase = createClient(supabaseUrl, getSupabaseServiceKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const url = new URL(req.url);

    const community = url.searchParams.get("community");

    const rawLimit = Number(url.searchParams.get("limit") ?? "1000");
    const limit = Math.min(Math.max(rawLimit, 1), 2000);

    let query = supabase
      .from("mail_push_candidates")
      .select(
        "phone_digits, community, pending_mail_count, oldest_mail_at, latest_mail_at, nearest_expires_at, mail_ids",
      )
      .order("latest_mail_at", { ascending: false })
      .limit(limit);

    if (community) {
      query = query.eq("community", community);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as MailPushCandidateRow[];

    const sanitizedData = await Promise.all(
      rows
        .filter((row) => row.phone_digits)
        .map(async (row) => {
          const phoneForMatch = normalizeBrazilPhoneForMatch(row.phone_digits);

          const matchKey = await hmacSha256Hex(phoneForMatch, matchSecret);

          const batchKey = await hmacSha256Hex(
            `${phoneForMatch}|${row.community}|${row.mail_ids.join(",")}`,
            matchSecret,
          );

          return {
            match_key: matchKey,
            batch_key: batchKey,
            community: row.community,
            pending_mail_count: row.pending_mail_count,
            oldest_mail_at: row.oldest_mail_at,
            latest_mail_at: row.latest_mail_at,
            nearest_expires_at: row.nearest_expires_at,
            notification: {
              title: "Correspondência disponível",
              body: getNotificationBody(row.pending_mail_count),
            },
          };
        }),
    );

    return jsonResponse({
      ok: true,
      generated_at: new Date().toISOString(),
      total: sanitizedData.length,
      data: sanitizedData,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado na API.";

    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      500,
    );
  }
});
