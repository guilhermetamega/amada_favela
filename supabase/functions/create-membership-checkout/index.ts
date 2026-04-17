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

const LOG_PREFIX = "[create-membership-checkout]";
const PLATFORM_RETAINED_CENTS = 250;
const PLATFORM_TRANSFER_CENTS = 250;
const THIRD_PARTY_TRANSFER_CENTS = 100;

type RequestBody = {
  recurring?: boolean;
};

type UserRow = {
  id: string;
  fullname: string | null;
  email: string | null;
  comunity: string | null;
  stripe_customer_id: string | null;
};

type AssociationRow = {
  id: string;
  name: string;
  community: string;
  monthly_fee: number | string | null;
  stripe_third_party_account_id: string | null;
  is_active: boolean;
};

type ConnectedAccountRow = {
  id: string;
  stripe_account_id: string | null;
  onboarding_completed: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements_currently_due: string[] | null;
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

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

function buildCheckoutReturnUrls(baseUrl: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    successUrl: `${normalizedBaseUrl}/payment/result?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${normalizedBaseUrl}/payment/result?status=cancel`,
  };
}

function toCents(value: number | string | null | undefined) {
  const normalized =
    typeof value === "number"
      ? value
      : Number(
          String(value ?? "")
            .replace(",", ".")
            .trim(),
        );

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("Mensalidade inválida.");
  }

  return Math.round(normalized * 100);
}

function getStaticSplit(hasThirdParty: boolean) {
  return {
    platformRetainedCents: PLATFORM_RETAINED_CENTS,
    platformTransferCents: PLATFORM_TRANSFER_CENTS,
    thirdPartyTransferCents: hasThirdParty ? THIRD_PARTY_TRANSFER_CENTS : 0,
  };
}

function getMinimumGrossCents(hasThirdParty: boolean) {
  const split = getStaticSplit(hasThirdParty);
  return (
    split.platformRetainedCents +
    split.platformTransferCents +
    split.thirdPartyTransferCents +
    100
  );
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
      return json(401, { error: "Authorization header ausente." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const kayoAccountId = Deno.env.get("STRIPE_KAYO_ACCOUNT_ID");
    const appBaseUrl = Deno.env.get("APP_BASE_URL");
    const configuredSuccessUrl = Deno.env.get("STRIPE_SUCCESS_URL");
    const configuredCancelUrl = Deno.env.get("STRIPE_CANCEL_URL");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey ||
      !stripeSecretKey ||
      !kayoAccountId
    ) {
      return json(500, {
        error: "Variáveis obrigatórias do servidor não configuradas.",
      });
    }

    const fallbackUrls = appBaseUrl
      ? buildCheckoutReturnUrls(appBaseUrl)
      : null;

    const successUrl =
      configuredSuccessUrl?.trim() || fallbackUrls?.successUrl || null;
    const cancelUrl =
      configuredCancelUrl?.trim() || fallbackUrls?.cancelUrl || null;

    if (!successUrl || !cancelUrl) {
      return json(500, {
        error:
          "Configure APP_BASE_URL ou defina STRIPE_SUCCESS_URL e STRIPE_CANCEL_URL.",
      });
    }

    const stripe = new Stripe(stripeSecretKey);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      return json(401, { error: "Sessão inválida." });
    }

    const body = ((await req.json().catch(() => ({}))) ?? {}) as RequestBody;
    const recurring = body.recurring !== false;

    log("request", {
      authUserId: authUser.id,
      recurring,
    });

    const { data: userData, error: userError } = await admin
      .from("users")
      .select("id, fullname, email, comunity, stripe_customer_id")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      return json(404, { error: "Usuário não encontrado." });
    }

    const user = userData as UserRow;

    if (!user.comunity) {
      return json(400, { error: "Usuário sem comunidade vinculada." });
    }

    const { data: associationData, error: associationError } = await admin
      .from("association")
      .select(
        "id, name, community, monthly_fee, stripe_third_party_account_id, is_active",
      )
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
        .select(
          `
            id,
            stripe_account_id,
            onboarding_completed,
            charges_enabled,
            payouts_enabled,
            details_submitted,
            requirements_currently_due
          `,
        )
        .eq("association_id", association.id)
        .maybeSingle();

    if (connectedAccountError) {
      return json(500, {
        error: `Erro ao consultar conta conectada: ${connectedAccountError.message}`,
      });
    }

    const connectedAccount = connectedAccountData as ConnectedAccountRow | null;

    if (!connectedAccount?.stripe_account_id) {
      return json(400, {
        error: "Conta conectada Stripe da associação não configurada.",
      });
    }

    if (!connectedAccount.onboarding_completed) {
      return json(400, {
        error:
          "Onboarding da conta Stripe da associação ainda não foi concluído.",
      });
    }

    if (!connectedAccount.payouts_enabled) {
      return json(400, {
        error:
          "A conta conectada da associação ainda não está apta a receber repasses.",
      });
    }

    let amountTotalCents: number;

    try {
      amountTotalCents = toCents(association.monthly_fee);
    } catch {
      return json(400, {
        error: "Mensalidade da associação inválida.",
      });
    }

    const hasThirdParty = Boolean(association.stripe_third_party_account_id);
    const split = getStaticSplit(hasThirdParty);
    const minimumGrossCents = getMinimumGrossCents(hasThirdParty);

    if (amountTotalCents < minimumGrossCents) {
      return json(400, {
        error:
          "Mensalidade muito baixa para suportar a configuração financeira atual.",
      });
    }

    if (recurring) {
      const { data: existingPartner, error: existingPartnerError } = await admin
        .from("partners")
        .select("id, status, expires_at")
        .eq("user_id", user.id)
        .eq("association_id", association.id)
        .in("status", ["active", "past_due"])
        .gte("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPartnerError) {
        return json(500, {
          error: `Erro ao validar vínculo atual: ${existingPartnerError.message}`,
        });
      }

      if (existingPartner) {
        return json(400, {
          error:
            "Já existe um vínculo recorrente ativo ou em atraso para este associado.",
        });
      }

      const { data: existingOpenPayment, error: existingOpenPaymentError } =
        await admin
          .from("payments")
          .select("id, status, created_at")
          .eq("user_id", user.id)
          .eq("association_id", association.id)
          .eq("purpose", "partner_membership")
          .eq("checkout_mode", "subscription")
          .in("status", ["pending", "processing", "requires_action"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (existingOpenPaymentError) {
        return json(500, {
          error: `Erro ao validar cobrança em aberto: ${existingOpenPaymentError.message}`,
        });
      }

      if (existingOpenPayment) {
        return json(400, {
          error:
            "Já existe uma cobrança recorrente em aberto para este associado.",
        });
      }
    }

    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? authUser.email ?? undefined,
        name: user.fullname ?? undefined,
        metadata: {
          user_id: user.id,
          community: user.comunity,
          association_id: association.id,
        },
      });

      stripeCustomerId = customer.id;

      await admin
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);

      log("customer:created", {
        userId: user.id,
        stripeCustomerId,
      });
    }

    const transferGroup = `partner_membership_${user.id}_${Date.now()}`;
    const paymentMethods = recurring ? ["card"] : ["card", "boleto"];

    const commonMetadata = {
      user_id: user.id,
      association_id: association.id,
      community: association.community,
      recurring: String(recurring),
      transfer_group: transferGroup,
      checkout_mode: recurring ? "subscription" : "payment",
      has_third_party_destination: String(hasThirdParty),
    };

    const session = await stripe.checkout.sessions.create({
      mode: recurring ? "subscription" : "payment",
      customer: stripeCustomerId,
      client_reference_id: user.id,
      locale: "pt-BR",
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: paymentMethods as Array<"card" | "boleto">,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: amountTotalCents,
            product_data: {
              name: recurring
                ? `Mensalidade - ${association.name}`
                : `Pagamento avulso - ${association.name}`,
            },
            ...(recurring
              ? {
                  recurring: {
                    interval: "month" as const,
                  },
                }
              : {}),
          },
        },
      ],
      ...(recurring
        ? {
            subscription_data: {
              metadata: commonMetadata,
            },
          }
        : {
            payment_intent_data: {
              metadata: commonMetadata,
            },
            payment_method_options: {
              boleto: {
                expires_after_days: 3,
              },
            },
          }),
      metadata: commonMetadata,
      customer_update: {
        address: "auto",
        name: "auto",
      },
      billing_address_collection: "required",
    });

    if (!session.url) {
      return json(500, {
        error: "A Stripe não retornou uma URL pública de checkout.",
      });
    }

    const { error: insertError } = await admin.from("payments").insert({
      user_id: user.id,
      association_id: association.id,
      connected_account_id: connectedAccount.id,
      provider: "stripe",
      purpose: "partner_membership",
      payment_method_type: null,
      status: "pending",
      currency: "brl",
      amount_total: amountTotalCents,
      amount_platform_fee: split.platformRetainedCents,
      amount_platform_transfer: split.platformTransferCents,
      amount_third_party_transfer: split.thirdPartyTransferCents,
      amount_association_transfer: 0,
      amount_stripe_fee: 0,
      reference_month: null,
      period_start: null,
      period_end: null,
      description: recurring
        ? `Mensalidade - ${association.name}`
        : `Pagamento avulso - ${association.name}`,
      paid_at: null,
      stripe_payment_intent_id: null,
      stripe_checkout_session_id: session.id,
      stripe_charge_id: null,
      stripe_transfer_id: null,
      stripe_balance_transaction_id: null,
      stripe_customer_id: stripeCustomerId,
      stripe_invoice_id: null,
      external_reference: `partner_membership:checkout_session:${session.id}`,
      metadata: {
        source: "create-membership-checkout",
        user_id: user.id,
        association_id: association.id,
        community: association.community,
        transfer_group: transferGroup,
        has_third_party_destination: hasThirdParty,
      },
      gateway_response: {
        initial_checkout_mode: session.mode,
        initial_payment_status: session.payment_status,
      },
      community: association.community,
      checkout_mode: recurring ? "subscription" : "payment",
      stripe_subscription_id:
        typeof session.subscription === "string" ? session.subscription : null,
      stripe_event_id: null,
      transfer_group: transferGroup,
      stripe_platform_transfer_id: null,
      stripe_third_party_transfer_id: null,
      stripe_association_transfer_id: null,
      platform_transfer_destination_account_id: kayoAccountId,
      third_party_transfer_destination_account_id:
        association.stripe_third_party_account_id,
      association_transfer_destination_account_id:
        connectedAccount.stripe_account_id,
      created_by: user.id,
      updated_by: user.id,
    });

    if (insertError) {
      log("payment:insert-error", {
        message: insertError.message,
        sessionId: session.id,
      });

      return json(500, {
        error: `Não foi possível registrar o pagamento pendente: ${insertError.message}`,
      });
    }

    log("checkout:created", {
      sessionId: session.id,
      recurring,
      paymentMethods,
      userId: user.id,
      associationId: association.id,
      connectedAccountId: connectedAccount.id,
    });

    return json(200, {
      url: session.url,
      sessionId: session.id,
      paymentMethods,
    });
  } catch (error) {
    log("fatal", {
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao criar checkout.",
    });

    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao criar checkout.",
    });
  }
});
