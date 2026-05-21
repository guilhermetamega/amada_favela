import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { exchangeAuthorizationCode, getMercadoPagoConfig } from "../_shared/mercadopago.ts";

serve(async (req) => {
  if (req.method !== "GET") return new Response("Método não permitido", { status: 405 });
  const mp = getMercadoPagoConfig();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return new Response("Secrets não configurados", { status: 500 });
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const redirectBase = `${mp.appBaseUrl}/sponsor/raffles`;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (err || !code || !state) return Response.redirect(`${redirectBase}?mercadopago=error&message=${encodeURIComponent(err || "Parâmetros inválidos")}`, 302);

  const { data: oauthState } = await admin.from("sponsor_mercadopago_oauth_states").select("id,sponsor_id,expires_at,used_at").eq("state", state).maybeSingle();
  if (!oauthState || oauthState.used_at || new Date(oauthState.expires_at).getTime() < Date.now()) {
    return Response.redirect(`${redirectBase}?mercadopago=error&message=${encodeURIComponent("State OAuth inválido")}`, 302);
  }

  try {
    const token = await exchangeAuthorizationCode({ clientId: mp.clientId, clientSecret: mp.clientSecret, code, redirectUri: `${mp.appBaseUrl}/functions/v1/sponsor-mercadopago-oauth-callback`, state });
    const tokenExpiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
    await admin.from("sponsor_mercadopago_accounts").upsert({
      sponsor_id: oauthState.sponsor_id,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_expires_at: tokenExpiresAt,
      status: "active",
      mp_user_id: String(token.user_id),
      updated_at: new Date().toISOString(),
    }, { onConflict: "sponsor_id" });
    await admin.from("sponsor_mercadopago_oauth_states").update({ used_at: new Date().toISOString() }).eq("id", oauthState.id);
    return Response.redirect(`${redirectBase}?mercadopago=success`, 302);
  } catch (error) {
    return Response.redirect(`${redirectBase}?mercadopago=error&message=${encodeURIComponent(error instanceof Error ? error.message : "Erro OAuth")}`, 302);
  }
});
