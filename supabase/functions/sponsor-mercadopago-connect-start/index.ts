import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";
import {
  buildMercadoPagoAuthorizationUrl,
  getMercadoPagoConfig,
} from "../_shared/mercadopago.ts";
import { getSponsorFromRequest } from "../_shared/sponsor-session.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST")
    return json(405, { error: "Método não permitido." });

  try {
    const { sponsor } = await getSponsorFromRequest(req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole)
      return json(500, { error: "Secrets não configurados." });

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });
    const mp = getMercadoPagoConfig();
    const state = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await admin
      .from("sponsor_mercadopago_oauth_states")
      .insert({
        state,
        sponsor_id: sponsor.id,
        expires_at: expiresAt,
      });
    if (error) return json(500, { error: error.message });

    const url = buildMercadoPagoAuthorizationUrl({
      clientId: mp.clientId,
      redirectUri: `${mp.appBaseUrl}/functions/v1/sponsor-mercadopago-oauth-callback`,
      state,
    });

    return json(200, { url, expiresAt });
  } catch (error) {
    return json(401, {
      error: error instanceof Error ? error.message : "Sessão inválida.",
    });
  }
});
