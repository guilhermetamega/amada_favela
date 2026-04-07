import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type RequestBody = {
  sessionId?: string;
};

type PaymentRow = {
  id: string;
  user_id: string;
  status: string;
  stripe_subscription_id: string | null;
  paid_at: string | null;
  period_end: string | null;
  created_at: string;
};

type PartnerRow = {
  id: string;
  expires_at: string;
  status: string | null;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function isPartnerActive(partner: PartnerRow | null) {
  if (!partner) return false;
  if (partner.status === "expired" || partner.status === "cancelled") {
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
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return json(401, { error: "Sessão inválida." });
    }

    const body = ((await req.json().catch(() => ({}))) ?? {}) as RequestBody;
    const sessionId = body.sessionId?.trim();

    if (!sessionId) {
      return json(400, { error: "sessionId é obrigatório." });
    }

    const { data: paymentData, error: paymentError } = await admin
      .from("membership_payments")
      .select(
        "id, user_id, status, stripe_subscription_id, paid_at, period_end, created_at",
      )
      .eq("stripe_checkout_session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) {
      return json(500, { error: paymentError.message });
    }

    if (!paymentData) {
      return json(404, { error: "Cobrança não encontrada." });
    }

    const payment = paymentData as PaymentRow;

    const { data: partnerData, error: partnerError } = await admin
      .from("partners")
      .select("id, expires_at, status")
      .eq("membership_payment_id", payment.id)
      .maybeSingle();

    if (partnerError) {
      return json(500, { error: partnerError.message });
    }

    const partner = (partnerData ?? null) as PartnerRow | null;
    const partnerActive = isPartnerActive(partner);

    return json(200, {
      paymentId: payment.id,
      paymentStatus: payment.status,
      partnerActive,
      subscriptionId: payment.stripe_subscription_id,
      expiresAt: partner?.expires_at ?? payment.period_end ?? null,
      terminal:
        partnerActive ||
        ["failed", "cancelled", "past_due"].includes(payment.status),
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao consultar cobrança.",
    });
  }
});
