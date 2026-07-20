import { supabase } from "@/services/supabase/client";
import {
  validatePasswordPolicy,
  type PasswordIdentityContext,
} from "@/lib/password-policy";
import type { CurrentUserAccessContext, UserRole } from "@/lib/permissions";

type CurrentUserAccessContextRow = {
  user_id: string;
  role: UserRole;
  community: string | null;
  association_id: string | null;
  password_change_required: boolean;

  can_view_financial_dashboard: boolean;
  can_view_user_sensitive_data: boolean;
  can_edit_user_basic_data: boolean;
  can_edit_user_sensitive_data: boolean;
  can_reset_user_password: boolean;
  can_export_reports: boolean;
};

type PasswordIdentityRow = {
  fullname: string | null;
  cpf: string | null;
  phone: string | null;
};

function mapAccessContext(
  row: CurrentUserAccessContextRow,
): CurrentUserAccessContext {
  return {
    userId: row.user_id,
    role: row.role,
    community: row.community,
    associationId: row.association_id,
    passwordChangeRequired: row.password_change_required,

    canViewFinancialDashboard: row.can_view_financial_dashboard,
    canViewUserSensitiveData: row.can_view_user_sensitive_data,
    canEditUserBasicData: row.can_edit_user_basic_data,
    canEditUserSensitiveData: row.can_edit_user_sensitive_data,
    canResetUserPassword: row.can_reset_user_password,
    canExportReports: row.can_export_reports,
  };
}

export async function getCurrentUserAccessContext(): Promise<CurrentUserAccessContext> {
  const { data, error } = await supabase.rpc("get_current_user_access_context");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CurrentUserAccessContextRow[];
  const row = rows[0];

  if (!row) {
    throw new Error(
      "Não foi possível carregar o contexto de acesso do usuário.",
    );
  }

  return mapAccessContext(row);
}

async function getPasswordIdentityContext(
  userId: string,
): Promise<PasswordIdentityContext> {
  const { data, error } = await supabase
    .from("users")
    .select("fullname, cpf, phone")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const profile = data as PasswordIdentityRow;

  return {
    fullname: profile.fullname,
    cpf: profile.cpf,
    phone: profile.phone,
  };
}

export async function changeRequiredPassword(newPassword: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const identity = await getPasswordIdentityContext(user.id);

  validatePasswordPolicy(newPassword, identity);

  const { error: passwordError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (passwordError) {
    throw new Error(passwordError.message);
  }

  const { error: completionError } = await supabase.rpc(
    "complete_required_password_change",
  );

  if (completionError) {
    throw new Error(
      "A senha foi atualizada, mas não foi possível liberar sua navegação. Tente novamente.",
    );
  }
}
