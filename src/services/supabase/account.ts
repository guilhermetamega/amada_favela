import { supabase } from "@/services/supabase/client";

export async function deleteMyAccount(confirmText: string) {
  const normalized = confirmText.trim().toUpperCase();

  if (normalized !== "CONFIRMO") {
    throw new Error('Digite "CONFIRMO" para excluir a conta.');
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.access_token) {
    throw new Error("Sessão inválida.");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/delete-my-account`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        confirmText: normalized,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    success?: boolean;
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error || "Não foi possível excluir a conta.");
  }

  await supabase.auth.signOut();
}
