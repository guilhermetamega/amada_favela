import { supabase } from "@/services/supabase/client";

export type MembershipPixCheckout = {
  existing: boolean;
  internalPaymentId: string;
  paymentId: string;
  status:
    | "pending"
    | "processing"
    | "requires_action"
    | "succeeded"
    | "failed"
    | "cancelled";
  providerStatus?: string | null;
  providerStatusDetail?: string | null;
  expiresAt: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  paidAt?: string | null;
};

function getPixTransactionData(source: unknown) {
  const root =
    typeof source === "object" && source !== null
      ? (source as Record<string, unknown>)
      : null;

  const pointOfInteraction =
    root?.point_of_interaction && typeof root.point_of_interaction === "object"
      ? (root.point_of_interaction as Record<string, unknown>)
      : null;

  const transactionData =
    pointOfInteraction?.transaction_data &&
    typeof pointOfInteraction.transaction_data === "object"
      ? (pointOfInteraction.transaction_data as Record<string, unknown>)
      : null;

  return {
    qrCode:
      typeof transactionData?.qr_code === "string"
        ? transactionData.qr_code
        : null,
    qrCodeBase64:
      typeof transactionData?.qr_code_base64 === "string"
        ? transactionData.qr_code_base64
        : null,
    ticketUrl:
      typeof transactionData?.ticket_url === "string"
        ? transactionData.ticket_url
        : null,
  };
}

export async function createMembershipPixCheckout() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Erro ao verificar sessão atual.");
  }

  if (!session?.access_token) {
    throw new Error("Sessão expirada ou usuário não autenticado.");
  }

  const { data, error } = await supabase.functions.invoke(
    "mercadopago-create-membership-pix",
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {},
    },
  );

  if (error) {
    throw new Error(error.message || "Não foi possível gerar o pagamento Pix.");
  }

  return data as MembershipPixCheckout;
}

export async function getMembershipPixCheckoutStatus(
  internalPaymentId: string,
) {
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
        id,
        provider_payment_id,
        status,
        provider_status,
        provider_status_detail,
        paid_at,
        expires_at,
        checkout_url,
        gateway_response
      `,
    )
    .eq("id", internalPaymentId)
    .eq("provider", "mercadopago")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível consultar o status do Pix.");
  }

  const transactionData = getPixTransactionData(data.gateway_response);

  return {
    existing: true,
    internalPaymentId: data.id,
    paymentId: data.provider_payment_id ?? "",
    status: data.status as MembershipPixCheckout["status"],
    providerStatus: data.provider_status ?? null,
    providerStatusDetail: data.provider_status_detail ?? null,
    paidAt: data.paid_at ?? null,
    expiresAt: data.expires_at ?? null,
    qrCode: transactionData.qrCode,
    qrCodeBase64: transactionData.qrCodeBase64,
    ticketUrl: transactionData.ticketUrl ?? data.checkout_url ?? null,
  } satisfies MembershipPixCheckout;
}
