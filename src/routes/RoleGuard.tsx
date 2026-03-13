import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import type { UserRole } from "@/lib/permissions";

type RoleGuardProps = {
  allowedRoles?: UserRole[];
  requirePartner?: boolean;
};

export default function RoleGuard({
  allowedRoles,
  requirePartner = false,
}: RoleGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  if (authLoading || permissionsLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-zinc-300 shadow-xl">
          Carregando...
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!permissions) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(permissions.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requirePartner && !permissions.isPartnerActive) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
