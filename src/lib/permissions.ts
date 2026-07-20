export type UserRole = "admin" | "president" | "employee" | "user";

export type CurrentUserAccessContext = {
  userId: string;
  role: UserRole;
  community: string | null;
  associationId: string | null;
  passwordChangeRequired: boolean;

  canViewFinancialDashboard: boolean;
  canViewUserSensitiveData: boolean;
  canEditUserBasicData: boolean;
  canEditUserSensitiveData: boolean;
  canResetUserPassword: boolean;
  canExportReports: boolean;
};

export type Permissions = {
  role: UserRole;
  isPartnerActive: boolean;

  isAdmin: boolean;
  isPresident: boolean;
  isEmployee: boolean;
  isUser: boolean;

  canAccessPremium: boolean;
  canCreateHomeRent: boolean;
  canManageRoles: boolean;
  canManageAllRoles: boolean;

  canAccessUserAdministration: boolean;
  canViewFinancialDashboard: boolean;
  canViewUserSensitiveData: boolean;
  canEditUserBasicData: boolean;
  canEditUserSensitiveData: boolean;
  canResetUserPassword: boolean;
  canExportReports: boolean;
};

export function buildPermissions(
  accessContext: CurrentUserAccessContext,
  isPartnerActive: boolean,
): Permissions {
  const isAdmin = accessContext.role === "admin";
  const isPresident = accessContext.role === "president";
  const isEmployee = accessContext.role === "employee";
  const isUser = accessContext.role === "user";

  const canAccessUserAdministration =
    isAdmin ||
    isPresident ||
    accessContext.canViewUserSensitiveData ||
    accessContext.canEditUserBasicData ||
    accessContext.canEditUserSensitiveData ||
    accessContext.canResetUserPassword;

  return {
    role: accessContext.role,
    isPartnerActive,

    isAdmin,
    isPresident,
    isEmployee,
    isUser,

    canAccessPremium: isAdmin || isPresident || isPartnerActive,
    canCreateHomeRent: isAdmin || isPresident || isPartnerActive,
    canManageRoles: isAdmin || isPresident,
    canManageAllRoles: isAdmin,

    canAccessUserAdministration,
    canViewFinancialDashboard: accessContext.canViewFinancialDashboard,
    canViewUserSensitiveData: accessContext.canViewUserSensitiveData,
    canEditUserBasicData: accessContext.canEditUserBasicData,
    canEditUserSensitiveData: accessContext.canEditUserSensitiveData,
    canResetUserPassword: accessContext.canResetUserPassword,
    canExportReports: accessContext.canExportReports,
  };
}
