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

const LOG_PREFIX = "[create-platform-third-party-stripe-onboarding]";
const ACCOUNT_KEY = "third_party_partner";

type RequestBody = {
  action?: "status" | "open";
};

type UserRow = {
  id: string;
  role: string | null;
};

type PlatformConnectedAccountRow = {
  id: string;
  account_key: string;
  provider: "stripe";
  account_type: "express";
  label: string;
  stripe_account_id: string | null;
  onboarding_completed: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  card_payments_enabled: boolean;
  transfers_enabled: boolean;
  requirements_currently_due: string[];
  requirements_eventually_due: string[];
  requirements_past_due: string[];
  requirements_disabled_reason: string | null;
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

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Variável obrigatória não configurada: ${name}`);
  }

  return value;
}

function getPartnerLabel() {
  return (
    Deno.env.get("PLATFORM_THIRD_PARTY_STRIPE_LABEL")?.trim() ||
    "Sócio da plataforma"
  );
}

function buildEmptyStatus(label: string) {
  return {
    connected: false,
    label,
    stripe_connected_account_id: null,
    stripe_onboarding_completed: false,
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
    card_payments_enabled: false,
    transfers_enabled: false,
    requirements_currently_due: [],
    requirements_disabled_reason: null,
    mode: "none",
    url: null,
  };
}

async function mirrorThirdPartyAccountToAssociations(params: {
  admin: ReturnType<typeof createClient>;
  stripeAccountId: string;
  label: string;
  enabled: boolean;
}) {
  if (params.enabled) {
    const { data, error } = await params.admin
      .from("association")
      .update({
        stripe_third_party_account_id: params.stripeAccountId,
        stripe_third_party_label: params.label,
        updated_at: new Date().toISOString(),
      })
      .eq("is_active", true)
      .select("id");

    if (error) {
      throw new Error(
        `Falha ao aplicar conta do sócio nas associações: ${error.message}`,
      );
    }

    return data?.length ?? 0;
  }

  const { data, error } = await params.admin
    .from("association")
    .update({
      stripe_third_party_account_id: null,
      stripe_third_party_label: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_third_party_account_id", params.stripeAccountId)
    .select("id");

  if (error) {
    throw new Error(
      `Falha ao remover conta do sócio das associações: ${error.message}`,
    );
  }

  return data?.length ?? 0;
}

async function upsertPlatformAccount(params: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  label: string;
  stripeAccountId: string;
  account: Stripe.Account;
}) {
  const onboardingCompleted = Boolean(
    params.account.details_submitted && params.account.payouts_enabled,
  );

  const cardPaymentsEnabled = getCapabilityStatus(
    params.account,
    "card_payments",
  );

  const transfersEnabled = getCapabilityStatus(params.account, "transfers");

  const payload = {
    account_key: ACCOUNT_KEY,
    provider: "stripe",
    account_type: "express",
    label: params.label,
    stripe_account_id: params.stripeAccountId,
    onboarding_completed: onboardingCompleted,
    charges_enabled: Boolean(params.account.charges_enabled),
    payouts_enabled: Boolean(params.account.payouts_enabled),
    details_submitted: Boolean(params.account.details_submitted),
    card_payments_enabled: cardPaymentsEnabled,
    transfers_enabled: transfersEnabled,
    default_currency: params.account.default_currency ?? "brl",
    country: params.account.country ?? "BR",
    requirements_currently_due:
      params.account.requirements?.currently_due ?? [],
    requirements_eventually_due:
      params.account.requirements?.eventually_due ?? [],
    requirements_past_due: params.account.requirements?.past_due ?? [],
    requirements_disabled_reason:
      params.account.requirements?.disabled_reason ?? null,
    business_name: params.account.business_profile?.name ?? params.label,
    business_email: params.account.email ?? null,
    metadata: {
      source: "create-platform-third-party-stripe-onboarding",
      last_sync_at: new Date().toISOString(),
    },
    updated_by: params.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await params.admin
    .from("platform_connected_accounts")
    .upsert(
      {
        ...payload,
        created_by: params.userId,
      },
      {
        onConflict: "account_key",
      },
    )
    .select(
      `
        id,
        account_key,
        provider,
        account_type,
        label,
        stripe_account_id,
        onboarding_completed,
        charges_enabled,
        payouts_enabled,
        details_submitted,
        card_payments_enabled,
        transfers_enabled,
        requirements_currently_due,
        requirements_eventually_due,
        requirements_past_due,
        requirements_disabled_reason
      `,
    )
    .single();

  if (error || !data) {
    throw new Error(
      error?.message || "Falha ao salvar conta integrada da plataforma.",
    );
  }

  const mirroredAssociations = await mirrorThirdPartyAccountToAssociations({
    admin: params.admin,
    stripeAccountId: params.stripeAccountId,
    label: params.label,
    enabled: onboardingCompleted,
  });

  return {
    row: data as PlatformConnectedAccountRow,
    mirroredAssociations,
  };
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

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecret = getRequiredEnv("STRIPE_SECRET_KEY");
    const appBaseUrl = getRequiredEnv("APP_BASE_URL").trim().replace(/\/$/, "");

    const label = getPartnerLabel();
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const action = body.action ?? "open";

    const stripe = new Stripe(stripeSecret);

    const userClient = createClient(supabaseUrl, anonKey, {
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
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      return json(401, { error: "Sessão inválida." });
    }

    const { data: profileData, error: profileError } = await admin
      .from("users")
      .select("id, role")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profileData) {
      return json(404, { error: "Usuário não encontrado." });
    }

    const profile = profileData as UserRow;

    if (profile.role !== "admin") {
      return json(403, {
        error: "Apenas Super Admins podem configurar a conta Stripe do sócio.",
      });
    }

    const { data: existingRow, error: existingError } = await admin
      .from("platform_connected_accounts")
      .select(
        `
          id,
          account_key,
          provider,
          account_type,
          label,
          stripe_account_id,
          onboarding_completed,
          charges_enabled,
          payouts_enabled,
          details_submitted,
          card_payments_enabled,
          transfers_enabled,
          requirements_currently_due,
          requirements_eventually_due,
          requirements_past_due,
          requirements_disabled_reason
        `,
      )
      .eq("account_key", ACCOUNT_KEY)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    let stripeAccountId =
      (existingRow as PlatformConnectedAccountRow | null)?.stripe_account_id ??
      null;

    if (!stripeAccountId && action === "status") {
      return json(200, buildEmptyStatus(label));
    }

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: label,
          product_description:
            "Recebimento de repasses da plataforma AMA da Favela.",
        },
        metadata: {
          account_key: ACCOUNT_KEY,
          created_by: profile.id,
          source: "super-admin",
        },
      });

      stripeAccountId = account.id;

      log("stripe-account:created", {
        stripeAccountId,
        createdBy: profile.id,
      });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    const { row, mirroredAssociations } = await upsertPlatformAccount({
      admin,
      userId: profile.id,
      label,
      stripeAccountId,
      account,
    });

    const baseStatus = {
      connected: Boolean(row.stripe_account_id),
      label: row.label,
      stripe_connected_account_id: row.stripe_account_id,
      stripe_onboarding_completed: row.onboarding_completed,
      charges_enabled: row.charges_enabled,
      payouts_enabled: row.payouts_enabled,
      details_submitted: row.details_submitted,
      card_payments_enabled: row.card_payments_enabled,
      transfers_enabled: row.transfers_enabled,
      requirements_currently_due: row.requirements_currently_due ?? [],
      requirements_disabled_reason: row.requirements_disabled_reason,
      mirrored_associations: mirroredAssociations,
    };

    if (action === "status") {
      return json(200, {
        ...baseStatus,
        mode: "status",
        url: null,
      });
    }

    if (row.onboarding_completed) {
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

      return json(200, {
        ...baseStatus,
        mode: "login",
        url: loginLink.url,
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appBaseUrl}/super-admin?stripe_partner=refresh`,
      return_url: `${appBaseUrl}/super-admin?stripe_partner=return`,
      type: "account_onboarding",
    });

    return json(200, {
      ...baseStatus,
      mode: "onboarding",
      url: accountLink.url,
    });
  } catch (error) {
    log("fatal", {
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao configurar Stripe do sócio.",
    });

    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao configurar Stripe do sócio.",
    });
  }
});
