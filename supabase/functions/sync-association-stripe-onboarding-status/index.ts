import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const LOG_PREFIX = "[sync-association-stripe-onboarding-status]";

type UserRow = {
  id: string;
  role: string | null;
  comunity: string | null;
};

type AssociationRow = {
  id: string;
};

type ConnectedAccountRow = {
  id: string;
  stripe_account_id: string | null;
  onboarding_completed: boolean;
};

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function getCapabilityStatus(
  account: Stripe.Account,
  capabilityKey: string,
): boolean {
  const capabilities = account.capabilities as Record<string, string> | null;
  return capabilities?.[capabilityKey] === "active";
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
      .select("id")
      .eq("community", user.comunity)
      .eq("is_active", true)
      .single();

    if (associationError || !associationData) {
      return json(404, { error: "Associação não encontrada." });
    }

    const association = associationData as AssociationRow;

    const { data: connectedAccountData, error: connectedAccountError } =
      await admin
        .from("connected_accounts")
        .select("id, stripe_account_id, onboarding_completed")
        .eq("association_id", association.id)
        .maybeSingle();

    if (connectedAccountError) {
      throw new Error(connectedAccountError.message);
    }

    const connectedAccount = (connectedAccountData ??
      null) as ConnectedAccountRow | null;

    if (!connectedAccount?.stripe_account_id) {
      return json(200, {
        stripe_connected_account_id: null,
        stripe_onboarding_completed: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        pix_enabled: false,
        card_payments_enabled: false,
        boleto_enabled: false,
        requirements_currently_due: [],
      });
    }

    const account = await stripe.accounts.retrieve(
      connectedAccount.stripe_account_id,
    );

    const onboardingCompleted = Boolean(
      account.details_submitted && account.payouts_enabled,
    );

    const payload = {
      stripe_account_id: connectedAccount.stripe_account_id,
      onboarding_completed: onboardingCompleted,
      charges_enabled: Boolean(account.charges_enabled),
      payouts_enabled: Boolean(account.payouts_enabled),
      details_submitted: Boolean(account.details_submitted),
      pix_enabled: getCapabilityStatus(account, "pix_payments"),
      card_payments_enabled: getCapabilityStatus(account, "card_payments"),
      boleto_enabled: getCapabilityStatus(account, "boleto_payments"),
      requirements_currently_due: account.requirements?.currently_due ?? [],
      requirements_eventually_due: account.requirements?.eventually_due ?? [],
      requirements_past_due: account.requirements?.past_due ?? [],
      requirements_disabled_reason:
        account.requirements?.disabled_reason ?? null,
      business_name: account.business_profile?.name ?? null,
      business_email: account.email ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await admin
      .from("connected_accounts")
      .update(payload)
      .eq("id", connectedAccount.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    log("sync:success", {
      associationId: association.id,
      stripeAccountId: connectedAccount.stripe_account_id,
      onboardingCompleted,
      chargesEnabled: payload.charges_enabled,
      payoutsEnabled: payload.payouts_enabled,
      requirementsCurrentlyDue: payload.requirements_currently_due,
    });

    return json(200, {
      stripe_connected_account_id: connectedAccount.stripe_account_id,
      stripe_onboarding_completed: onboardingCompleted,
      charges_enabled: payload.charges_enabled,
      payouts_enabled: payload.payouts_enabled,
      details_submitted: payload.details_submitted,
      pix_enabled: payload.pix_enabled,
      card_payments_enabled: payload.card_payments_enabled,
      boleto_enabled: payload.boleto_enabled,
      requirements_currently_due: payload.requirements_currently_due,
    });
  } catch (error) {
    log("fatal", {
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao sincronizar onboarding Stripe.",
    });

    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao sincronizar onboarding Stripe.",
    });
  }
});
