import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, birth } = await req.json();

    if (!email || !birth) {
      return json(
        { ok: false, code: "invalid_credentials", message: "Dados inválidos." },
        400,
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: sponsor, error } = await supabase
      .from("sponsors")
      .select("id, name, email, role, birth, expires_at, status")
      .eq("email", email.trim().toLowerCase())
      .eq("birth", birth)
      .maybeSingle();

    if (error || !sponsor) {
      return json(
        { ok: false, code: "invalid_credentials", message: "Dados inválidos." },
        401,
      );
    }

    if (sponsor.status !== "active") {
      return json(
        { ok: false, code: "inactive", message: "Acesso indisponível." },
        403,
      );
    }

    const now = new Date();
    const expiresAt = new Date(sponsor.expires_at);

    if (expiresAt.getTime() < now.getTime()) {
      return json(
        {
          ok: false,
          code: "expired",
          message: "Seu acesso de patrocinador expirou.",
          expires_at: sponsor.expires_at,
          sponsor_name: sponsor.name,
        },
        403,
      );
    }

    const rawToken = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
    const tokenHash = await sha256(rawToken);

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);

    const forwardedFor = req.headers.get("x-forwarded-for");
    const userAgent = req.headers.get("user-agent") ?? null;

    const { error: sessionError } = await supabase
      .from("sponsor_sessions")
      .insert({
        sponsor_id: sponsor.id,
        token_hash: tokenHash,
        expires_at: sessionExpiresAt.toISOString(),
        user_agent: userAgent,
        ip: forwardedFor?.split(",")[0]?.trim() ?? null,
      });

    if (sessionError) {
      return json(
        {
          ok: false,
          code: "invalid_credentials",
          message: sessionError.message,
        },
        500,
      );
    }

    const { data: features, error: featuresError } = await supabase
      .from("sponsor_feature_access")
      .select(
        `
        feature_key,
        can_view,
        can_create,
        can_update,
        can_delete,
        sponsor_features!inner (
          key,
          label,
          description,
          icon,
          route,
          sort_order,
          is_active
        )
      `,
      )
      .eq("sponsor_id", sponsor.id)
      .eq("can_view", true)
      .eq("sponsor_features.is_active", true)
      .order("sort_order", {
        foreignTable: "sponsor_features",
        ascending: true,
      });

    if (featuresError) {
      return json(
        {
          ok: false,
          code: "invalid_credentials",
          message: featuresError.message,
        },
        500,
      );
    }

    return json({
      ok: true,
      token: rawToken,
      sponsor: {
        id: sponsor.id,
        name: sponsor.name,
        email: sponsor.email,
        role: sponsor.role,
        expires_at: sponsor.expires_at,
      },
      features: (features ?? []).map((item: any) => ({
        key: item.sponsor_features.key,
        label: item.sponsor_features.label,
        description: item.sponsor_features.description,
        icon: item.sponsor_features.icon,
        route: item.sponsor_features.route,
        can_view: item.can_view,
        can_create: item.can_create,
        can_update: item.can_update,
        can_delete: item.can_delete,
      })),
    });
  } catch (error) {
    return json(
      {
        ok: false,
        code: "invalid_credentials",
        message: error instanceof Error ? error.message : "Erro inesperado.",
      },
      500,
    );
  }
});
