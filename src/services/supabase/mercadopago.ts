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
};

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
