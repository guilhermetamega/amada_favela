import { supabase } from "@/services/supabase/client";
import type { AssociationPlatformFeeItem } from "@/types/plataform_fee";

async function assertCurrentUserIsAdmin() {
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Não foi possível validar as permissões do usuário.");
  }

  if (profile.role !== "admin") {
    throw new Error(
      "Apenas o Super Admin pode gerenciar as taxas da plataforma.",
    );
  }

  return user;
}

export async function listAssociationPlatformFeesAsAdmin(): Promise<
  AssociationPlatformFeeItem[]
> {
  await assertCurrentUserIsAdmin();

  const { data, error } = await supabase
    .from("association")
    .select(
      `
        id,
        name,
        community,
        monthly_fee,
        platform_fee_cents,
        is_active
      `,
    )
    .order("community", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AssociationPlatformFeeItem[];
}

export async function updateAssociationPlatformFeeAsAdmin(
  associationId: string,
  platformFeeCents: number,
): Promise<AssociationPlatformFeeItem> {
  await assertCurrentUserIsAdmin();

  if (!associationId.trim()) {
    throw new Error("Associação não informada.");
  }

  if (
    !Number.isInteger(platformFeeCents) ||
    platformFeeCents < 0 ||
    platformFeeCents > 100000
  ) {
    throw new Error("Informe uma taxa entre R$ 0,00 e R$ 1.000,00.");
  }

  const { data, error } = await supabase
    .from("association")
    .update({
      platform_fee_cents: platformFeeCents,
    })
    .eq("id", associationId)
    .select(
      `
        id,
        name,
        community,
        monthly_fee,
        platform_fee_cents,
        is_active
      `,
    )
    .single();

  if (error || !data) {
    throw new Error(
      error?.message || "Não foi possível atualizar a taxa da plataforma.",
    );
  }

  return data as AssociationPlatformFeeItem;
}
