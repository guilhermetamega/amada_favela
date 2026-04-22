import { supabase } from "@/services/supabase/client";

export type MailRecipient = {
  id: string;
  fullname: string;
  address_1: string;
  address_number: string | null;
  address_2: string | null;
  comunity: string | null;
};

export type MailItem = {
  id: string;
  title: string;
  description: string;
  created_by: string;
  owner_id: string;
  fullname: string;
  status: "not_withdraw" | "withdrawn";
  created_at: string;
  expires_at: string;
};

async function getCurrentProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, comunity, fullname, address_1, address_number, address_2")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile;
}

export async function getEligibleMailRecipients(search = "") {
  const profile = await getCurrentProfile();

  if (!["president", "employee", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  let query = supabase
    .from("users")
    .select("id, fullname, address_1, address_number, address_2, comunity")
    .order("fullname", { ascending: true });

  if (profile.role !== "admin") {
    query = query.eq("comunity", profile.comunity);
  }

  if (search.trim()) {
    query = query.ilike("fullname", `%${search.trim()}%`);
  }

  const { data: users, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!users?.length) return [];

  const userIds = users.map((user) => user.id);

  const { data: activePartners, error: partnersError } = await supabase
    .from("partners")
    .select("user_id")
    .in("user_id", userIds)
    .gte("expires_at", new Date().toISOString());

  if (partnersError) {
    throw new Error(partnersError.message);
  }

  const activeUserIds = new Set(
    (activePartners ?? []).map((row) => row.user_id),
  );

  return users.filter((user) => activeUserIds.has(user.id)) as MailRecipient[];
}

export async function getUserPendingMail(ownerId: string) {
  const { data, error } = await supabase
    .from("mail")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "not_withdraw")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MailItem[];
}

export async function createMail(input: {
  owner_id: string;
  fullname: string;
  title: string;
  description: string;
}) {
  const profile = await getCurrentProfile();

  if (!["president", "employee", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("mail")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      owner_id: input.owner_id,
      fullname: input.fullname,
      created_by: profile.id,
      status: "not_withdraw",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MailItem;
}

export async function deleteMail(mailId: string) {
  const { error } = await supabase.from("mail").delete().eq("id", mailId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUserPendingMail() {
  const profile = await getCurrentProfile();

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("expires_at")
    .eq("user_id", profile.id)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (partnerError) {
    throw new Error(partnerError.message);
  }

  const isPartnerActive =
    !!partner && new Date(partner.expires_at) >= new Date();

  if (!isPartnerActive) {
    throw new Error(
      "Você precisa ter uma assinatura de sócio ativa para acessar suas cartas.",
    );
  }

  const { data, error } = await supabase
    .from("mail")
    .select("*")
    .eq("owner_id", profile.id)
    .eq("status", "not_withdraw")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile,
    items: (data ?? []) as MailItem[],
  };
}

export async function markMailAsWithdrawn(mailId: string) {
  const { error } = await supabase
    .from("mail")
    .update({ status: "withdrawn" })
    .eq("id", mailId);

  if (error) {
    throw new Error(error.message);
  }
}
