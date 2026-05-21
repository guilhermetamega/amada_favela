import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, json } from "../_shared/http.ts";
import { getSponsorFromRequest } from "../_shared/sponsor-session.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "GET") return json(405, { error: "Método não permitido." });

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);
    const { data, error } = await supabase
      .from("sponsor_mercadopago_accounts")
      .select("status, mp_user_id, token_expires_at")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (error) return json(500, { error: error.message });

    const connected = Boolean(data && data.status === "active" && data.mp_user_id);

    return json(200, {
      connected,
      status: data?.status ?? "not_connected",
      message: connected
        ? "Conta Mercado Pago conectada."
        : "Conecte sua conta Mercado Pago para liberar a criação de rifas.",
      tokenExpiresAt: data?.token_expires_at ?? null,
    });
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : "Sessão inválida." });
  }
});
