import { supabase } from "@/services/supabase/client";
import type {
  MembershipCheckoutResponse,
  MembershipCheckoutStatusResponse,
  OpenMembershipPayment,
} from "@/types/membership";

const LOG_PREFIX = "[membership-service]";

export async function createMembershipCheckout(
  recurring = true,
): Promise<MembershipCheckoutResponse> {
  console.info(`${LOG_PREFIX} createMembershipCheckout:start`, { recurring });

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
      body: { recurring },
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

  const { data, error } = await supabase.functions.invoke(
    "sync-open-membership-payment-state",
    {
      body: {},
    },
  );

  if (error) {
    console.error("[membership-service] getOpenMembershipPayment:error", {
      message: error.message,
    });
    throw new Error(
      error.message || "Não foi possível consultar pagamentos em aberto.",
    );
  }

  const payment = (data?.payment ?? null) as OpenMembershipPayment | null;

  console.info("[membership-service] getOpenMembershipPayment:success", {
    hasOpenPayment: Boolean(payment),
    paymentId: payment?.id ?? null,
    status: payment?.status ?? null,
  });

  return payment;
}
