import { supabase } from "@/services/supabase/client";
import type {
  MembershipCheckoutResponse,
  MembershipCheckoutStatusResponse,
} from "@/types/membership";

export async function createMembershipCheckout(
  recurring = true,
): Promise<MembershipCheckoutResponse> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Erro ao validar sessão.");
  }

  if (!session?.access_token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke(
    "create-membership-checkout",
    {
      body: { recurring },
    },
  );

  if (error) {
    throw new Error(error.message || "Erro ao iniciar pagamento.");
  }

  if (!data?.url) {
    throw new Error("Checkout não retornou URL válida.");
  }

  return data as MembershipCheckoutResponse;
}

export async function getMembershipCheckoutStatus(
  sessionId: string,
): Promise<MembershipCheckoutStatusResponse> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Erro ao validar sessão.");
  }

  if (!session?.access_token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke(
    "get-membership-checkout-status",
    {
      body: { sessionId },
    },
  );

  if (error) {
    throw new Error(error.message || "Erro ao consultar pagamento.");
  }

  return data as MembershipCheckoutStatusResponse;
}
