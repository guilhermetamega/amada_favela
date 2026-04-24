import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, redirect } from "../_shared/http.ts";
import {
  exchangeAuthorizationCode,
  getMercadoPagoConfig,
} from "../_shared/mercadopago.ts";

const LOG_PREFIX = "[mercadopago-oauth-callback]";

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function buildFrontendRedirect(
  baseUrl: string,
  params: Record<string, string>,
) {
  const url = new URL(`${baseUrl}/payments/mercadopago/oauth/callback`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "GET") {
    return new Response("Método não permitido.", { status: 405 });
  }

  const mp = getMercadoPagoConfig();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Secrets do Supabase não configurados.", {
      status: 500,
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");
    const oauthErrorDescription = url.searchParams.get("error_description");

    if (oauthError) {
      return redirect(
        buildFrontendRedirect(mp.appBaseUrl, {
          status: "error",
          message: oauthErrorDescription || oauthError,
        }),
      );
    }

    if (!code || !state) {
      return redirect(
        buildFrontendRedirect(mp.appBaseUrl, {
          status: "error",
          message: "Parâmetros code/state ausentes no callback.",
        }),
      );
    }

    const { data: oauthState, error: stateError } = await admin
      .from("mercadopago_oauth_states")
      .select("id, user_id, association_id, expires_at, used_at")
      .eq("state", state)
      .maybeSingle();

    if (stateError || !oauthState) {
      return redirect(
        buildFrontendRedirect(mp.appBaseUrl, {
          status: "error",
          message: "State OAuth inválido.",
        }),
      );
    }

    if (oauthState.used_at) {
      return redirect(
        buildFrontendRedirect(mp.appBaseUrl, {
          status: "error",
          message: "State OAuth já utilizado.",
        }),
      );
    }

    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      return redirect(
        buildFrontendRedirect(mp.appBaseUrl, {
          status: "error",
          message: "State OAuth expirado.",
        }),
      );
    }

    const token = await exchangeAuthorizationCode({
      clientId: mp.clientId,
      clientSecret: mp.clientSecret,
      code,
      redirectUri: mp.redirectUri,
      state,
    });

    const tokenExpiresAt = new Date(
      Date.now() + token.expires_in * 1000,
    ).toISOString();

    const { data: association, error: associationError } = await admin
      .from("association")
      .select("id, community")
      .eq("id", oauthState.association_id)
      .single();

    if (associationError || !association) {
      throw new Error("Associação não encontrada ao salvar seller account.");
    }

    const { error: upsertError } = await admin
      .from("mercadopago_seller_accounts")
      .upsert(
        {
          association_id: association.id,
          community: association.community,
          connected_by: oauthState.user_id,
          mp_user_id: String(token.user_id),
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          public_key: token.public_key,
          token_type: token.token_type,
          scope: token.scope,
          live_mode: token.live_mode,
          expires_in: token.expires_in,
          token_expires_at: tokenExpiresAt,
          last_refreshed_at: new Date().toISOString(),
          status: "active",
          updated_at: new Date().toISOString(),
          metadata: {
            source: "authorization_code",
          },
        },
        {
          onConflict: "association_id",
        },
      );

    if (upsertError) {
      throw new Error(`Falha ao salvar seller account: ${upsertError.message}`);
    }

    await admin
      .from("mercadopago_oauth_states")
      .update({ used_at: new Date().toISOString() })
      .eq("id", oauthState.id);

    log("seller-linked", {
      associationId: association.id,
      mpUserId: token.user_id,
    });

    return redirect(
      buildFrontendRedirect(mp.appBaseUrl, {
        status: "success",
        associationId: association.id,
      }),
    );
  } catch (error) {
    return redirect(
      buildFrontendRedirect(mp.appBaseUrl, {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao concluir vínculo OAuth.",
      }),
    );
  }
});
