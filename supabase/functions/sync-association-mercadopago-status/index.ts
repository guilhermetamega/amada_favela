import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";

type MercadoPagoSellerStatus =
  | "not_connected"
  | "active"
  | "expired"
  | "revoked";

function normalizeSellerStatus(value: unknown): MercadoPagoSellerStatus {
  if (value === "active") return "active";
  if (value === "expired") return "expired";
  if (value === "revoked") return "revoked";

  return "not_connected";
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
          "Apenas presidentes ou admins podem consultar o status do Mercado Pago.",
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

    const { data: seller, error: sellerError } = await admin
      .from("mercadopago_seller_accounts")
      .select(
        `
          id,
          mp_user_id,
          status,
          created_at,
          updated_at,
          last_refreshed_at
        `,
      )
      .eq("association_id", association.id)
      .maybeSingle();

    if (sellerError) {
      return json(500, {
        error: `Não foi possível consultar a conta Mercado Pago: ${sellerError.message}`,
      });
    }

    if (!seller) {
      return json(200, {
        mercadopago_user_id: null,
        mercadopago_status: "not_connected",
        mercadopago_connected_at: null,
      });
    }

    return json(200, {
      mercadopago_user_id: seller.mp_user_id ?? null,
      mercadopago_status: normalizeSellerStatus(seller.status),
      mercadopago_connected_at:
        seller.created_at ??
        seller.last_refreshed_at ??
        seller.updated_at ??
        null,
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao sincronizar status do Mercado Pago.",
    });
  }
});
