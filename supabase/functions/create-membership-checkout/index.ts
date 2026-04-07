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
  stripe_connected_account_id: string | null;
  stripe_third_party_account_id: string | null;
  stripe_onboarding_completed: boolean;
  is_active: boolean;
};

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
        "id, name, community, monthly_fee, stripe_connected_account_id, stripe_third_party_account_id, stripe_onboarding_completed, is_active",
      )
      .eq("community", user.comunity)
      .eq("is_active", true)
      .single();

    if (associationError || !associationData) {
      return json(404, { error: "Associação não encontrada." });
    }

    const association = associationData as AssociationRow;

    if (!association.stripe_connected_account_id) {
      return json(400, {
        error: "Conta conectada Stripe da associação não configurada.",
      });
    }

    if (!association.stripe_third_party_account_id) {
      return json(400, {
        error:
          "Conta third-party da associação não configurada para o split financeiro.",
      });
    }

    if (!association.stripe_onboarding_completed) {
      return json(400, {
        error:
          "Onboarding da conta Stripe da associação ainda não foi concluído.",
      });
    }

    let amountGrossCents: number;

    try {
      amountGrossCents = toCents(association.monthly_fee);
    } catch {
      return json(400, {
        error: "Mensalidade da associação inválida.",
      });
    }

    if (amountGrossCents < 600) {
      return json(400, {
        error:
          "Mensalidade muito baixa para suportar o split fixo configurado.",
      });
    }

    if (recurring) {
      const { data: existingSubscription } = await admin
        .from("membership_payments")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("association_id", association.id)
        .eq("checkout_mode", "subscription")
        .in("status", ["pending", "processing", "active", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSubscription) {
        return json(400, {
          error:
            "Já existe uma mensalidade recorrente ativa ou em processamento para este associado.",
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
    }

    const transferGroup = `membership_${user.id}_${Date.now()}`;

    const commonMetadata = {
      user_id: user.id,
      association_id: association.id,
      community: association.community,
      recurring: String(recurring),
      transfer_group: transferGroup,
    };

    const session = await stripe.checkout.sessions.create({
      mode: recurring ? "subscription" : "payment",
      customer: stripeCustomerId,
      client_reference_id: user.id,
      locale: "pt-BR",
      success_url: successUrl,
      cancel_url: cancelUrl,

      // Card habilita Apple Pay / Google Pay quando suportados pelo cliente.
      // Pix e boleto entram como métodos locais.
      payment_method_types: ["card", "boleto"],

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: amountGrossCents,
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

      // Mantém a coleta básica do comprador consistente.
      customer_update: {
        address: "auto",
        name: "auto",
      },

      // Garante billing address quando necessário para boleto/cartão.
      billing_address_collection: "required",
    });

    if (!session.url) {
      return json(500, {
        error: "A Stripe não retornou uma URL pública de checkout.",
      });
    }

    const insertPayload = {
      user_id: user.id,
      community: association.community,
      association_id: association.id,
      amount_gross_cents: amountGrossCents,
      currency: "brl",
      stripe_checkout_session_id: session.id,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id:
        typeof session.subscription === "string" ? session.subscription : null,
      status: "pending",
      payment_method: null,
      checkout_mode: recurring ? "subscription" : "payment",
      transfer_group: transferGroup,
      platform_retained_cents: 250,
      platform_two_cents: 250,
      third_party_cents: 100,
      notes: null,
    };

    const { error: insertError } = await admin
      .from("membership_payments")
      .insert(insertPayload);

    if (insertError) {
      return json(500, {
        error: `Não foi possível registrar o pagamento pendente: ${insertError.message}`,
      });
    }

    return json(200, {
      url: session.url,
      sessionId: session.id,
      paymentMethods: ["card", "boleto"],
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao criar checkout.",
    });
  }
});
