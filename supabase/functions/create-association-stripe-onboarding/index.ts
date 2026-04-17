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

const LOG_PREFIX = "[create-association-stripe-onboarding]";

type UserRow = {
  id: string;
  role: string | null;
  comunity: string | null;
};

type AssociationRow = {
  id: string;
  name: string;
  cnpj: string;
  community: string;
  is_active: boolean;
};

type ConnectedAccountRow = {
  id: string;
  association_id: string;
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

function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
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
    const appBaseUrl = Deno.env.get("APP_BASE_URL");

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey ||
      !stripeSecret ||
      !appBaseUrl
    ) {
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
        error: "Você não pode configurar a Stripe da associação.",
      });
    }

    if (!user.comunity) {
      return json(400, { error: "Usuário sem comunidade vinculada." });
    }

    const { data: associationData, error: associationError } = await admin
      .from("association")
      .select("id, name, cnpj, community, is_active")
      .eq("community", user.comunity)
      .eq("is_active", true)
      .single();

    if (associationError || !associationData) {
      return json(404, { error: "Associação não encontrada." });
    }

    const association = associationData as AssociationRow;

    let connectedAccountRecord: ConnectedAccountRow | null = null;

    const {
      data: existingConnectedAccount,
      error: existingConnectedAccountError,
    } = await admin
      .from("connected_accounts")
      .select("id, association_id, stripe_account_id, onboarding_completed")
      .eq("association_id", association.id)
      .maybeSingle();

    if (existingConnectedAccountError) {
      throw new Error(existingConnectedAccountError.message);
    }

    connectedAccountRecord = (existingConnectedAccount ??
      null) as ConnectedAccountRow | null;

    let stripeAccountId = connectedAccountRecord?.stripe_account_id ?? null;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company",
        company: {
          name: association.name,
          tax_id: onlyDigits(association.cnpj) || undefined,
        },
        metadata: {
          association_id: association.id,
          community: association.community,
          created_by: user.id,
        },
      });

      stripeAccountId = account.id;

      log("stripe-account:created", {
        associationId: association.id,
        stripeAccountId,
      });

      if (connectedAccountRecord?.id) {
        const { error } = await admin
          .from("connected_accounts")
          .update({
            stripe_account_id: stripeAccountId,
            onboarding_completed: false,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connectedAccountRecord.id);

        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await admin
          .from("connected_accounts")
          .insert({
            association_id: association.id,
            provider: "stripe",
            account_type: "express",
            stripe_account_id: stripeAccountId,
            country: "BR",
            onboarding_completed: false,
            charges_enabled: false,
            payouts_enabled: false,
            details_submitted: false,
            pix_enabled: false,
            card_payments_enabled: false,
            boleto_enabled: false,
            default_currency: "brl",
            requirements_currently_due: [],
            requirements_eventually_due: [],
            requirements_past_due: [],
            metadata: {
              source: "create-association-stripe-onboarding",
            },
            created_by: user.id,
            updated_by: user.id,
          })
          .select("id, association_id, stripe_account_id, onboarding_completed")
          .single();

        if (error || !data) {
          throw new Error(
            error?.message || "Falha ao criar connected_accounts.",
          );
        }

        connectedAccountRecord = data as ConnectedAccountRow;
      }
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);
    const onboardingCompleted = Boolean(
      account.details_submitted && account.payouts_enabled,
    );

    const { error: syncError } = await admin
      .from("connected_accounts")
      .update({
        stripe_account_id: stripeAccountId,
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
        business_name: account.business_profile?.name ?? association.name,
        business_email: account.email ?? null,
        business_document: onlyDigits(association.cnpj) || null,
        metadata: {
          last_sync_source: "create-association-stripe-onboarding",
        },
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("association_id", association.id);

    if (syncError) {
      throw new Error(syncError.message);
    }

    if (onboardingCompleted) {
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

      return json(200, {
        url: loginLink.url,
        mode: "login",
      });
    }

    const normalizedBaseUrl = appBaseUrl.trim().replace(/\/$/, "");

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${normalizedBaseUrl}/admin/association?stripe=refresh`,
      return_url: `${normalizedBaseUrl}/admin/association?stripe=return`,
      type: "account_onboarding",
    });

    return json(200, {
      url: accountLink.url,
      mode: "onboarding",
    });
  } catch (error) {
    log("fatal", {
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao iniciar onboarding Stripe.",
    });

    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao iniciar onboarding Stripe.",
    });
  }
});
