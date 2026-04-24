import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";
import {
  buildMercadoPagoAuthorizationUrl,
  getMercadoPagoConfig,
} from "../_shared/mercadopago.ts";

const LOG_PREFIX = "[mercadopago-connect-start]";

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json(401, { error: "Authorization header ausente." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json(500, { error: "Secrets do Supabase não configurados." });
    }

    const mp = getMercadoPagoConfig();

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: { persistSession: false },
    });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return json(401, { error: "Sessão inválida." });
    }

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("id, role, comunity")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return json(404, { error: "Perfil não encontrado." });
    }

    if (profile.role !== "president" && profile.role !== "admin") {
      return json(403, {
        error:
          "Apenas presidentes ou admins podem conectar a conta Mercado Pago.",
      });
    }

    const { data: association, error: associationError } = await admin
      .from("association")
      .select("id, community, is_active")
      .eq("community", profile.comunity)
      .eq("is_active", true)
      .single();

    if (associationError || !association) {
      return json(404, { error: "Associação ativa não encontrada." });
    }

    const state = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: stateError } = await admin
      .from("mercadopago_oauth_states")
      .insert({
        state,
        user_id: user.id,
        association_id: association.id,
        community: association.community,
        expires_at: expiresAt,
      });

    if (stateError) {
      return json(500, {
        error: `Não foi possível criar o estado OAuth: ${stateError.message}`,
      });
    }

    const url = buildMercadoPagoAuthorizationUrl({
      clientId: mp.clientId,
      redirectUri: mp.redirectUri,
      state,
    });

    log("authorization-url-created", {
      userId: user.id,
      associationId: association.id,
    });

    return json(200, {
      url,
      expiresAt,
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao iniciar OAuth.",
    });
  }
});
