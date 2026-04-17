import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const LOG_PREFIX = "[get-membership-checkout-status]";

type RequestBody = {
  sessionId?: string;
};

type PaymentRow = {
  id: string;
  user_id: string;
  status: string;
  payment_method_type: string | null;
  checkout_mode: string | null;
  stripe_subscription_id: string | null;
  paid_at: string | null;
  period_end: string | null;
  created_at: string;
};

type PartnerRow = {
  id: string;
  payment_id: string | null;
  expires_at: string;
  status: string | null;
  payment_status: string | null;
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

function isPartnerActive(partner: PartnerRow | null) {
  if (!partner) return false;

  if (
    partner.status === "expired" ||
    partner.status === "cancelled" ||
    partner.status === "past_due"
  ) {
    return false;
  }

  return new Date(partner.expires_at).getTime() >= Date.now();
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

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return json(500, {
        error: "Variáveis obrigatórias do servidor não configuradas.",
      });
    }

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
    const sessionId = body.sessionId?.trim();

    if (!sessionId) {
      return json(400, { error: "sessionId é obrigatório." });
    }

    log("lookup:start", {
      sessionId,
      authUserId: authUser.id,
    });

    const { data: paymentData, error: paymentError } = await admin
      .from("payments")
      .select(
        `
          id,
          user_id,
          status,
          payment_method_type,
          checkout_mode,
          stripe_subscription_id,
          paid_at,
          period_end,
          created_at
        `,
      )
      .eq("stripe_checkout_session_id", sessionId)
      .eq("purpose", "partner_membership")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (paymentError) {
      log("lookup:payment-error", { message: paymentError.message, sessionId });
      throw new Error(paymentError.message);
    }

    if (!paymentData) {
      return json(404, { error: "Pagamento não encontrado para esta sessão." });
    }

    const payment = paymentData as PaymentRow;

    const { data: partnerData, error: partnerError } = await admin
      .from("partners")
      .select("id, payment_id, expires_at, status, payment_status")
      .eq("payment_id", payment.id)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (partnerError) {
      log("lookup:partner-error", {
        message: partnerError.message,
        paymentId: payment.id,
      });
      throw new Error(partnerError.message);
    }

    const partner = (partnerData ?? null) as PartnerRow | null;
    const partnerActive = isPartnerActive(partner);

    const terminal =
      partnerActive ||
      ["failed", "cancelled", "refunded", "partially_refunded"].includes(
        payment.status,
      ) ||
      ["past_due", "cancelled", "expired"].includes(partner?.status ?? "");

    log("lookup:resolved", {
      sessionId,
      paymentId: payment.id,
      paymentStatus: payment.status,
      partnerId: partner?.id ?? null,
      partnerStatus: partner?.status ?? null,
      partnerActive,
      terminal,
    });

    return json(200, {
      paymentId: payment.id,
      paymentStatus: payment.status,
      paymentMethodType: payment.payment_method_type,
      checkoutMode: payment.checkout_mode,
      partnerId: partner?.id ?? null,
      partnerStatus: partner?.status ?? null,
      partnerActive,
      subscriptionId: payment.stripe_subscription_id,
      expiresAt: partner?.expires_at ?? payment.period_end ?? null,
      terminal,
    });
  } catch (error) {
    log("fatal", {
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao consultar cobrança.",
    });

    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao consultar cobrança.",
    });
  }
});
