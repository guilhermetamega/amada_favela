export type UserRole = "admin" | "president" | "employee" | "user";

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
};

export function buildPermissions(
  role: UserRole,
  isPartnerActive: boolean,
): Permissions {
  const isAdmin = role === "admin";
  const isPresident = role === "president";
  const isEmployee = role === "employee";
  const isUser = role === "user";

  return {
    role,
    isPartnerActive,

    isAdmin,
    isPresident,
    isEmployee,
    isUser,

    canAccessPremium: isAdmin || isPresident || isPartnerActive,

    canCreateHomeRent: isAdmin || isPresident || isPartnerActive,

    canManageRoles: isAdmin || isPresident,

    canManageAllRoles: isAdmin,
  };
}
