import { supabase } from "@/services/supabase/client";
import type {
  AdminCommunityOption,
  AdminUserUpdatePayload,
  AdminUserUpdateResponse,
} from "@/types/admin-user-edit";

type FunctionErrorWithContext = Error & {
  context?: Response;
};

async function getFunctionErrorMessage(error: FunctionErrorWithContext) {
  if (error.context) {
    try {
      const payload = await error.context.json();

      if (payload && typeof payload.error === "string") {
        return payload.error;
      }
    } catch {
      // Usa a mensagem padrão abaixo.
    }
  }

  return error.message || "Não foi possível atualizar o usuário.";
}

export async function updateAdminUser(
  payload: AdminUserUpdatePayload,
): Promise<AdminUserUpdateResponse> {
  const { data, error } = await supabase.functions.invoke("admin-update-user", {
    body: payload,
  });

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(error as FunctionErrorWithContext),
    );
  }

  if (!data || data.success !== true) {
    throw new Error(
      data?.error || "A atualização retornou uma resposta inválida.",
    );
  }

  return data as AdminUserUpdateResponse;
}

export async function listAdminCommunityOptions(): Promise<
  AdminCommunityOption[]
> {
  const { data, error } = await supabase
    .from("communities")
    .select("key, label")
    .eq("active", true)
    .order("label", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminCommunityOption[];
}
