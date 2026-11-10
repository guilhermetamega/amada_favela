import { supabase } from "@/services/supabase/client";
import type {
  MembershipCheckoutResponse,
  MembershipCheckoutStatusResponse,
  OpenMembershipPayment,
} from "@/types/membership";

const LOG_PREFIX = "[membership-service]";

export type MembershipPaymentMethods = {
  stripe: boolean;
  mercadopago: boolean;
};

export async function getMembershipPaymentMethods(): Promise<MembershipPaymentMethods> {
  const { data, error } = await supabase.functions.invoke(
    "get-membership-payment-methods",
    { body: {} },
  );

  if (error || typeof data?.stripe !== "boolean" || typeof data?.mercadopago !== "boolean") {
    console.error("[membership-service] getMembershipPaymentMethods:error", {
      message: error?.message,
      details: error?.details,
      data,
    });
    throw new Error(error?.message || "Não foi possível verificar os meios de pagamento.");
  }

  return data as MembershipPaymentMethods;
}

export async function createMembershipCheckout(
  recurring = true,
  months = 1,
): Promise<MembershipCheckoutResponse> {
  console.info(`${LOG_PREFIX} createMembershipCheckout:start`, { recurring, months });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(`${LOG_PREFIX} createMembershipCheckout:session-error`, {
      message: sessionError.message,
    });
    throw new Error("Erro ao validar sessão.");
  }

  if (!session?.access_token) {
    console.warn(`${LOG_PREFIX} createMembershipCheckout:no-session`);
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke(
    "create-membership-checkout",
    {
      body: { recurring, months },
    },
  );

  if (error) {
    console.error(`${LOG_PREFIX} createMembershipCheckout:function-error`, {
      message: error.message,
    });
    throw new Error(error.message || "Erro ao iniciar pagamento.");
  }

  if (!data?.url || !data?.sessionId) {
    console.error(`${LOG_PREFIX} createMembershipCheckout:invalid-response`, {
      data,
    });
    throw new Error("Checkout não retornou dados válidos.");
  }

  console.info(`${LOG_PREFIX} createMembershipCheckout:success`, {
    sessionId: data.sessionId,
    paymentMethods: data.paymentMethods ?? [],
  });

  return data as MembershipCheckoutResponse;
}

export async function getMembershipCheckoutStatus(
  sessionId: string,
): Promise<MembershipCheckoutStatusResponse> {
  console.info(`${LOG_PREFIX} getMembershipCheckoutStatus:start`, {
    sessionId,
  });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(`${LOG_PREFIX} getMembershipCheckoutStatus:session-error`, {
      message: sessionError.message,
    });
    throw new Error("Erro ao validar sessão.");
  }

  if (!session?.access_token) {
    console.warn(`${LOG_PREFIX} getMembershipCheckoutStatus:no-session`);
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke(
    "get-membership-checkout-status",
    {
      body: { sessionId },
    },
  );

  if (error) {
    console.error(`${LOG_PREFIX} getMembershipCheckoutStatus:function-error`, {
      message: error.message,
      sessionId,
    });
    throw new Error(error.message || "Erro ao consultar pagamento.");
  }

  console.info(`${LOG_PREFIX} getMembershipCheckoutStatus:success`, {
    sessionId,
    paymentId: data?.paymentId ?? null,
    paymentStatus: data?.paymentStatus ?? null,
    partnerStatus: data?.partnerStatus ?? null,
    partnerActive: data?.partnerActive ?? false,
    terminal: data?.terminal ?? false,
  });

  return data as MembershipCheckoutStatusResponse;
}

export async function getOpenMembershipPayment(): Promise<OpenMembershipPayment | null> {
  console.info("[membership-service] getOpenMembershipPayment:start");

  const { data, error } = await supabase.rpc("get_open_membership_payment");

  if (error) {
    console.error("[membership-service] getOpenMembershipPayment:error", {
      message: error.message,
    });
    throw new Error(
      error.message || "Não foi possível consultar pagamentos em aberto.",
    );
  }

  const payment = (data ?? null) as OpenMembershipPayment | null;

  console.info("[membership-service] getOpenMembershipPayment:success", {
    hasOpenPayment: Boolean(payment),
    paymentId: payment?.id ?? null,
    status: payment?.status ?? null,
  });

  return payment;
}

export async function syncOpenMembershipPaymentState(): Promise<OpenMembershipPayment | null> {
  console.info("[membership-service] syncOpenMembershipPaymentState:start");

  const { data, error } = await supabase.functions.invoke(
    "sync-open-membership-payment-state",
    {
      body: {},
    },
  );

  if (error) {
    console.error("[membership-service] syncOpenMembershipPaymentState:error", {
      message: error.message,
    });
    throw new Error(
      error.message || "Não foi possível sincronizar o pagamento em aberto.",
    );
  }

  return (data?.payment ?? null) as OpenMembershipPayment | null;
}
