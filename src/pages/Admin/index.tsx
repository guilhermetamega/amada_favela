import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import AdminModuleGrid from "@/components/admin/ModuleGrid";
import AdminPageSkeleton from "@/components/admin/PageSkeleton";
import AdminHero from "@/components/admin/Hero";
import ManageUsersModal from "@/components/admin/ManageUsersModal";
import NavigationButton from "@/components/ui/NavigationButton";
import { getNavigationButtonTheme } from "@/lib/navigation-button-theme";
import { usePermissions } from "@/hooks/usePermissions";
import { getAdminRoutes } from "@/routes/route-config";
import {
  getPresidentManageableUsers,
  updateUserRoleAsPresident,
} from "@/services/supabase/admin";
import type { ManageableUser } from "@/types/admin";
import MainLayout from "@/components/layout/MainLayout";

export default function AdminPage() {
  const { permissions, loading: permissionsLoading } = usePermissions();

  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  const adminRoutes = useMemo(() => getAdminRoutes(permissions), [permissions]);

  useEffect(() => {
    async function loadUsers() {
      if (!permissions?.canManageRoles) {
        setUsers([]);
        setLoadingUsers(false);
        return;
      }

      try {
        setLoadingUsers(true);
        setErrorMessage("");
        const data = await getPresidentManageableUsers();
        setUsers(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar usuários.";
        setErrorMessage(message);
      } finally {
        setLoadingUsers(false);
      }
    }

    void loadUsers();
  }, [permissions]);

  async function handleRoleChange(
    userId: string,
    newRole: "user" | "employee",
  ) {
    try {
      setUpdatingUserId(userId);
      setErrorMessage("");

      await updateUserRoleAsPresident(userId, newRole);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar role.";
      setErrorMessage(message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  const totalUsers = users.filter((user) => user.role === "user").length;
  const totalEmployees = users.filter(
    (user) => user.role === "employee",
  ).length;

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <AdminHero />

          {permissionsLoading ? (
            <AdminPageSkeleton />
          ) : (
            <>
              <div className="space-y-4">
                {permissions?.canManageRoles ? (
                  <section className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <NavigationButton
                      label="Gerenciar usuários"
                      description={`Usuários: ${
                        loadingUsers ? "..." : totalUsers
                      } • Funcionários: ${
                        loadingUsers ? "..." : totalEmployees
                      }`}
                      icon={Users}
                      onClick={() => setIsUsersModalOpen(true)}
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
                    Seu perfil de funcionário exibe apenas os módulos
                    operacionais liberados para essa role.
                  </div>
                ) : null}
              </div>

              <ManageUsersModal
                isOpen={isUsersModalOpen}
                users={users}
                loading={loadingUsers}
                errorMessage={errorMessage}
                updatingUserId={updatingUserId}
                onClose={() => setIsUsersModalOpen(false)}
                onRoleChange={handleRoleChange}
              />
            </>
          )}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
