import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import AdminModuleGrid from "@/components/admin/ModuleGrid";
import AdminPageSkeleton from "@/components/admin/PageSkeleton";
import AdminHero from "@/components/admin/Hero";
import NavigationButton from "@/components/ui/NavigationButton";
import { getNavigationButtonTheme } from "@/lib/navigation-button-theme";
import { usePermissions } from "@/hooks/usePermissions";
import { getAdminRoutes } from "@/routes/route-config";

export default function AdminPage() {
  const navigate = useNavigate();

  const { permissions, loading: permissionsLoading } = usePermissions();

  const adminRoutes = useMemo(() => getAdminRoutes(permissions), [permissions]);

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <AdminHero />

          {permissionsLoading ? (
            <AdminPageSkeleton />
          ) : (
            <div className="space-y-4">
              {permissions?.canAccessUserAdministration ? (
                <section className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <NavigationButton
                    label="Central de Usuários"
                    description="Consulte usuários, vínculos e pagamentos da comunidade."
                    icon={Users}
                    onClick={() => navigate("/admin/users")}
                    color={getNavigationButtonTheme("cyan")}
                  />
                </section>
              ) : null}

              {adminRoutes.length > 0 ? (
                <AdminModuleGrid routes={adminRoutes} />
              ) : (
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Nenhum módulo administrativo disponível para o seu perfil.
                </div>
              )}

              {permissions?.isEmployee ? (
                <div className="rounded-3xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  Seu perfil de funcionário exibe apenas os módulos e operações
                  autorizados pela associação.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
