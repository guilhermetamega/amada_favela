import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "GET" && req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "Usuário não autenticado." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "Configuração do Supabase incompleta." });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json(401, { error: "Sessão inválida." });

  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("comunity")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return json(500, { error: profileError.message });
  if (!profile?.comunity) {
    return json(200, { stripe: false, mercadopago: false });
  }

  const { data: association, error: associationError } = await admin
    .from("association")
    .select("id")
    .eq("community", profile.comunity)
    .eq("is_active", true)
    .maybeSingle();
  if (associationError) return json(500, { error: associationError.message });
  if (!association) {
    return json(200, { stripe: false, mercadopago: false });
  }

  const [stripeResult, mercadoPagoResult] = await Promise.all([
    admin
      .from("connected_accounts")
      .select("onboarding_completed, charges_enabled, payouts_enabled, card_payments_enabled")
      .eq("association_id", association.id)
      .maybeSingle(),
    admin
      .from("mercadopago_seller_accounts")
      .select("id, mp_user_id, status")
      .eq("association_id", association.id)
      .maybeSingle(),
  ]);

  if (stripeResult.error) return json(500, { error: stripeResult.error.message });
  if (mercadoPagoResult.error) {
    return json(500, { error: mercadoPagoResult.error.message });
  }

  const stripe = Boolean(
    stripeResult.data?.onboarding_completed &&
      stripeResult.data?.payouts_enabled &&
      stripeResult.data?.card_payments_enabled,
  );
  const mercadopago = Boolean(
    mercadoPagoResult.data?.mp_user_id &&
      mercadoPagoResult.data.status === "active",
  );

  return json(200, {
    stripe,
    mercadopago,
  });
});
