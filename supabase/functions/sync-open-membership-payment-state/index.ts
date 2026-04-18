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

const LOG_PREFIX = "[sync-open-membership-payment-state]";

type OpenPaymentRow = {
  id: string;
  status: "pending" | "processing" | "requires_action";
  created_at: string;
  checkout_mode: string | null;
  stripe_checkout_session_id: string | null;
  gateway_response: Record<string, unknown> | null;
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey ||
      !stripeSecretKey
    ) {
      return json(500, {
        error: "Variáveis obrigatórias do servidor não configuradas.",
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

    const admin = createClient(supabaseUrl, serviceRoleKey, {
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

    const { data, error } = await admin
      .from("payments")
      .select(
        `
          id,
          status,
          created_at,
          checkout_mode,
          stripe_checkout_session_id,
          gateway_response
        `,
      )
      .eq("user_id", authUser.id)
      .eq("purpose", "partner_membership")
      .in("status", ["pending", "processing", "requires_action"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      log("db:query-error", {
        userId: authUser.id,
        message: error.message,
      });

      return json(500, {
        error: "Não foi possível consultar pagamentos em aberto.",
      });
    }

    const payment = (data ?? null) as OpenPaymentRow | null;

    if (!payment) {
      log("payment:none-open", { userId: authUser.id });

      return json(200, {
        payment: null,
      });
    }

    log("payment:found", {
      userId: authUser.id,
      paymentId: payment.id,
      status: payment.status,
      sessionId: payment.stripe_checkout_session_id,
    });

    if (
      payment.status === "processing" ||
      payment.status === "requires_action"
    ) {
      return json(200, {
        payment,
      });
    }

    if (!payment.stripe_checkout_session_id) {
      const { error: updateError } = await admin
        .from("payments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
          gateway_response: {
            ...(payment.gateway_response ?? {}),
            cancelled_reason: "missing_checkout_session_id",
            cancelled_by: "sync-open-membership-payment-state",
            cancelled_at: new Date().toISOString(),
          },
        })
        .eq("id", payment.id);

      if (updateError) {
        return json(500, {
          error: `Erro ao cancelar cobrança inválida: ${updateError.message}`,
        });
      }

      log("payment:cancelled-missing-session-id", {
        paymentId: payment.id,
      });

      return json(200, {
        payment: null,
      });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(
        payment.stripe_checkout_session_id,
      );

      log("stripe-session:retrieved", {
        paymentId: payment.id,
        sessionId: payment.stripe_checkout_session_id,
        stripeStatus: session.status,
        paymentStatus: session.payment_status,
      });

      if (session.status === "complete") {
        const { data: updated, error: updateError } = await admin
          .from("payments")
          .update({
            status:
              session.payment_status === "paid" ? "processing" : "pending",
            updated_at: new Date().toISOString(),
            gateway_response: {
              ...(payment.gateway_response ?? {}),
              sync_state_checked_at: new Date().toISOString(),
              checkout_session_status: session.status,
              checkout_payment_status: session.payment_status,
            },
          })
          .eq("id", payment.id)
          .select(
            `
              id,
              status,
              created_at,
              checkout_mode,
              stripe_checkout_session_id,
              gateway_response
            `,
          )
          .single();

        if (updateError || !updated) {
          return json(500, {
            error: updateError?.message || "Erro ao atualizar pagamento.",
          });
        }

        log("payment:kept-after-complete-session", {
          paymentId: payment.id,
          status: updated.status,
        });

        return json(200, {
          payment: updated,
        });
      }

      if (session.status === "open") {
        await stripe.checkout.sessions.expire(
          payment.stripe_checkout_session_id,
        );

        log("stripe-session:expired", {
          paymentId: payment.id,
          sessionId: payment.stripe_checkout_session_id,
        });

        const { error: updateError } = await admin
          .from("payments")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
            gateway_response: {
              ...(payment.gateway_response ?? {}),
              cancelled_reason: "user_returned_without_completing_checkout",
              cancelled_by: "sync-open-membership-payment-state",
              cancelled_at: new Date().toISOString(),
              checkout_session_status_before_cancel: session.status,
              checkout_payment_status_before_cancel: session.payment_status,
            },
          })
          .eq("id", payment.id);

        if (updateError) {
          return json(500, {
            error: `Erro ao cancelar cobrança abandonada: ${updateError.message}`,
          });
        }

        log("payment:cancelled-after-return", {
          paymentId: payment.id,
        });

        return json(200, {
          payment: null,
        });
      }

      if (session.status === "expired") {
        const { error: updateError } = await admin
          .from("payments")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
            gateway_response: {
              ...(payment.gateway_response ?? {}),
              cancelled_reason: "checkout_session_expired",
              cancelled_by: "sync-open-membership-payment-state",
              cancelled_at: new Date().toISOString(),
            },
          })
          .eq("id", payment.id);

        if (updateError) {
          return json(500, {
            error: `Erro ao cancelar cobrança expirada: ${updateError.message}`,
          });
        }

        log("payment:cancelled-expired-session", {
          paymentId: payment.id,
        });

        return json(200, {
          payment: null,
        });
      }

      return json(200, {
        payment,
      });
    } catch (error) {
      log("stripe-session:retrieve-error", {
        paymentId: payment.id,
        sessionId: payment.stripe_checkout_session_id,
        message: error instanceof Error ? error.message : "unknown",
      });

      const { error: updateError } = await admin
        .from("payments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
          gateway_response: {
            ...(payment.gateway_response ?? {}),
            cancelled_reason: "checkout_session_not_retrievable",
            cancelled_by: "sync-open-membership-payment-state",
            cancelled_at: new Date().toISOString(),
          },
        })
        .eq("id", payment.id);

      if (updateError) {
        return json(500, {
          error: `Erro ao cancelar cobrança inválida: ${updateError.message}`,
        });
      }

      return json(200, {
        payment: null,
      });
    }
  } catch (error) {
    log("fatal", {
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao sincronizar pagamento em aberto.",
    });

    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao sincronizar pagamento em aberto.",
    });
  }
});
