import { supabase } from "@/services/supabase/client";
import type {
  ManageableUser,
  PlatformThirdPartyStripeStatus,
  UserRole,
} from "@/types/admin";

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
    .select("id, role, comunity")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile;
}

export async function getPresidentManageableUsers() {
  const profile = await getCurrentProfile();

  if (profile.role !== "president" && profile.role !== "admin") {
    throw new Error("Acesso não autorizado.");
  }

  let query = supabase
    .from("users")
    .select(
      "id, fullname, email, phone, address_1, address_2, comunity, role, created_at",
    )
    .in("role", ["user", "employee"])
    .order("fullname", { ascending: true });

  if (profile.role === "president") {
    query = query.eq("comunity", profile.comunity);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ManageableUser[];
}

export async function getAdminManageableUsers() {
  const profile = await getCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, fullname, email, phone,address_1, address_2, comunity, role, created_at",
    )
    .in("role", ["user", "employee", "president"])
    .order("fullname", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ManageableUser[];
}

export async function updateUserRoleAsPresident(
  targetUserId: string,
  newRole: Extract<UserRole, "user" | "employee">,
) {
  if (newRole !== "user" && newRole !== "employee") {
    throw new Error("Role inválida para esta operação.");
  }

  const profile = await getCurrentProfile();

  if (profile.role !== "president" && profile.role !== "admin") {
    throw new Error("Acesso não autorizado.");
  }

  const { data: targetUser, error: targetError } = await supabase
    .from("users")
    .select("id, comunity, role")
    .eq("id", targetUserId)
    .single();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (!targetUser) {
    throw new Error("Usuário alvo não encontrado.");
  }

  if (targetUser.role !== "user" && targetUser.role !== "employee") {
    throw new Error("Este usuário não pode ser alterado por esta tela.");
  }

  if (
    profile.role === "president" &&
    targetUser.comunity !== profile.comunity
  ) {
    throw new Error("Você só pode alterar usuários da sua comunidade.");
  }

  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", targetUserId)
    .in("role", ["user", "employee"]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateUserRoleAsAdmin(
  targetUserId: string,
  newRole: Extract<UserRole, "user" | "employee" | "president">,
) {
  const profile = await getCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("Acesso não autorizado.");
  }

  const { data: targetUser, error: targetError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", targetUserId)
    .single();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (targetUser.role === "admin") {
    throw new Error("Usuários admin não podem ser alterados por esta tela.");
  }

  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", targetUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getPlatformThirdPartyStripeStatus(): Promise<PlatformThirdPartyStripeStatus> {
  const { data, error } = await supabase.functions.invoke(
    "create-platform-third-party-stripe-onboarding",
    {
      body: {
        action: "status",
      },
    },
  );

  if (error) {
    throw new Error(
      error.message || "Não foi possível consultar a conta Stripe do sócio.",
    );
  }

  return data as PlatformThirdPartyStripeStatus;
}

export async function openPlatformThirdPartyStripeAccount(): Promise<PlatformThirdPartyStripeStatus> {
  const { data, error } = await supabase.functions.invoke(
    "create-platform-third-party-stripe-onboarding",
    {
      body: {
        action: "open",
      },
    },
  );

  if (error) {
    throw new Error(
      error.message || "Não foi possível abrir a conta Stripe do sócio.",
    );
  }

  if (!data?.url) {
    throw new Error("A Stripe não retornou um link válido.");
  }

  return data as PlatformThirdPartyStripeStatus;
}
