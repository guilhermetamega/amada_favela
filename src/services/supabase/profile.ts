import { supabase } from "@/services/supabase/client";

export async function getCurrentUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return profile;
}

export async function getPartnerStatus(userId: string) {
  const { data, error } = await supabase
    .from("partners")
    .select("expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return false;

  return new Date(data.expires_at) >= new Date();
}
