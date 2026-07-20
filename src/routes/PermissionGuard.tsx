import { Navigate, Outlet } from "react-router-dom";
import RouteSkeleton from "@/components/ui/RouteSkeleton";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permissions } from "@/lib/permissions";

type AdministrativePermission =
  | "canAccessUserAdministration"
  | "canViewFinancialDashboard"
  | "canViewUserSensitiveData"
  | "canEditUserBasicData"
  | "canEditUserSensitiveData"
  | "canResetUserPassword"
  | "canExportReports";

type PermissionGuardProps = {
  permission: AdministrativePermission;
  redirectTo?: string;
};

export default function PermissionGuard({
  permission,
  redirectTo = "/admin",
}: PermissionGuardProps) {
  const { permissions, loading, error } = usePermissions();

  if (loading) {
    return <RouteSkeleton />;
  }

  if (error || !permissions || !permissions[permission as keyof Permissions]) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
