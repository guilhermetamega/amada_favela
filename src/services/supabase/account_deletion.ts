import { supabase } from "@/services/supabase/client";

type RequestAccountDeletionInput = {
  cpf: string;
  birthDate: string;
  confirmation: string;
};

type RequestAccountDeletionResponse = {
  success: boolean;
  message: string;
};

export async function requestAccountDeletion(
  input: RequestAccountDeletionInput,
) {
  const { data, error } = await supabase.functions.invoke(
    "request-account-deletion",
    {
      body: {
        cpf: input.cpf,
        birthDate: input.birthDate,
        confirmation: input.confirmation,
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Erro ao enviar solicitação.");
  }

  return data as RequestAccountDeletionResponse;
}
