import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getSponsorFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!token) {
    throw new Error("Sessão do patrocinador não encontrada.");
  }

  const tokenHash = await sha256(token);
  const supabase = getAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("sponsor_sessions")
    .select("id, sponsor_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error("Sessão inválida.");
  }

  if (session.revoked_at) {
    throw new Error("Sessão revogada.");
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    throw new Error("Sessão expirada.");
  }

  const { data: sponsor, error: sponsorError } = await supabase
    .from("sponsors")
    .select(
      `
    id,
    name,
    email,
    role,
    status,
    expires_at,
    default_community
  `,
    )
    .eq("id", session.sponsor_id)
    .maybeSingle();

  if (sponsorError || !sponsor) {
    throw new Error("Patrocinador não encontrado.");
  }

  if (sponsor.status !== "active") {
    throw new Error("Patrocinador inativo.");
  }

  if (new Date(sponsor.expires_at).getTime() < Date.now()) {
    throw new Error("Acesso expirado.");
  }

  await supabase
    .from("sponsor_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", session.id);

  return {
    supabase,
    sponsor,
  };
}

export async function ensureFeatureAccess(
  supabase: ReturnType<typeof getAdminClient>,
  sponsorId: string,
  featureKey: string,
  action: "view" | "create" | "update" | "delete",
) {
  const { data, error } = await supabase
    .from("sponsor_feature_access")
    .select("can_view, can_create, can_update, can_delete")
    .eq("sponsor_id", sponsorId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Acesso não liberado para esta função.");
  }

  if (action === "view" && !data.can_view) {
    throw new Error("Sem permissão para visualizar.");
  }

  if (action === "create" && !data.can_create) {
    throw new Error("Sem permissão para criar.");
  }

  if (action === "update" && !data.can_update) {
    throw new Error("Sem permissão para editar.");
  }

  if (action === "delete" && !data.can_delete) {
    throw new Error("Sem permissão para excluir.");
  }
}

export function extractStoragePathFromPublicUrl(
  url: string,
  bucketName: string,
) {
  const marker = `/object/public/${bucketName}/`;
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}
