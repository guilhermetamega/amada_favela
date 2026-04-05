import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@latest?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type UserRow = {
  id: string;
  role: string | null;
  comunity: string | null;
};

type AssociationRow = {
  id: string;
  stripe_connected_account_id: string | null;
  stripe_onboarding_completed: boolean | null;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json(401, { error: "Não autenticado." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecret) {
      throw new Error("Variáveis obrigatórias do servidor não configuradas.");
    }

    const stripe = new Stripe(stripeSecret);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      return json(401, { error: "Sessão inválida." });
    }

    const { data: userData, error: userError } = await admin
      .from("users")
      .select("id, role, comunity")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      return json(404, { error: "Usuário não encontrado." });
    }

    const user = userData as UserRow;

    if (!["admin", "president"].includes(user.role ?? "")) {
      return json(403, {
        error: "Você não pode consultar a Stripe da associação.",
      });
    }

    if (!user.comunity) {
      return json(400, { error: "Usuário sem comunidade vinculada." });
    }

    const { data: associationData, error: associationError } = await admin
      .from("association")
      .select("id, stripe_connected_account_id, stripe_onboarding_completed")
      .eq("community", user.comunity)
      .single();

    if (associationError || !associationData) {
      return json(404, { error: "Associação não encontrada." });
    }

    const association = associationData as AssociationRow;

    if (!association.stripe_connected_account_id) {
      return json(200, {
        stripe_connected_account_id: null,
        stripe_onboarding_completed: false,
      });
    }

    const account = await stripe.accounts.retrieve(
      association.stripe_connected_account_id,
    );

    const onboardingCompleted = Boolean(
      account.details_submitted && account.payouts_enabled,
    );

    const { error: updateError } = await admin
      .from("association")
      .update({
        stripe_onboarding_completed: onboardingCompleted,
      })
      .eq("id", association.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return json(200, {
      stripe_connected_account_id: association.stripe_connected_account_id,
      stripe_onboarding_completed: onboardingCompleted,
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao sincronizar onboarding Stripe.",
    });
  }
});
