import { supabase } from "@/services/supabase/client";
import type { UserRole } from "@/lib/permissions";

type CurrentUserProfileRow = {
  id: string;
  role: UserRole;
  comunity: string | null;
};

type PartnerStatusRow = {
  expires_at: string;
  status: string | null;
};

export async function getCurrentUserProfile(
  userId: string,
): Promise<CurrentUserProfileRow> {
  const { data, error } = await supabase
    .from("users")
    .select("id, role, comunity")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CurrentUserProfileRow;
}

export async function getPartnerStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("partners")
    .select("expires_at, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return false;

  const partner = data as PartnerStatusRow;

  const notExpired = new Date(partner.expires_at).getTime() >= Date.now();

  if (!notExpired) {
    return false;
  }

  if (partner.status === "expired" || partner.status === "cancelled") {
    return false;
  }

  return true;
}
