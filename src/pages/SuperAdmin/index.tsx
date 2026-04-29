import { useEffect, useMemo, useState } from "react";
import { Circle, Users, Building2 } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";
import CollapsibleSection from "@/components/superAdmin/CollapsibleSection";
import UserManagementSection from "@/components/superAdmin/UserManagementSection";
import {
  getAdminManageableUsers,
  listCommunitiesAsAdmin,
  updateCurrentAdminCommunity,
  updateUserRoleAsAdmin,
} from "@/services/supabase/admin";
import type { ManageableUser, UserRole } from "@/types/admin";
import type { CommunityData } from "@/types/community";

export default function SuperAdminPage() {
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [adminCommunity, setAdminCommunity] = useState("");
  const [savingAdminCommunity, setSavingAdminCommunity] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openSection, setOpenSection] = useState<"users" | "communities" | "admin-community">("users");

  useEffect(() => {
    async function load() {
      try {
        setErrorMessage("");
        setSuccessMessage("");
        const [usersData, communitiesData] = await Promise.all([
          getAdminManageableUsers(),
          listCommunitiesAsAdmin(),
        ]);
        setUsers(usersData);
        setCommunities(communitiesData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Erro ao carregar dados.");
      } finally {
        setLoadingUsers(false);
        setLoadingCommunities(false);
      }
    }

    void load();
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((user) => user.fullname.toLowerCase().includes(searchTerm.toLowerCase())),
    [users, searchTerm],
  );

  async function handleRoleChange(
    userId: string,
    newRole: Extract<UserRole, "user" | "employee" | "president">,
  ) {
    try {
      setUpdatingUserId(userId);
      await updateUserRoleAsAdmin(userId, newRole);
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
      setSuccessMessage("Permissão atualizada com sucesso.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao atualizar role.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleSaveAdminCommunity() {
    try {
      setSavingAdminCommunity(true);
      await updateCurrentAdminCommunity(adminCommunity);
      setSuccessMessage("Comunidade do super admin atualizada com sucesso.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao atualizar comunidade.");
    } finally {
      setSavingAdminCommunity(false);
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-6">
          <DashboardHeader title="Super Admin" description="Gerencie usuários e comunidades da plataforma." />

          {errorMessage ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{errorMessage}</div> : null}
          {successMessage ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{successMessage}</div> : null}

          <CollapsibleSection
            id="users"
            title="Usuários globais"
            description="Gerencie roles de moradores, funcionários e presidentes."
            icon={<Users size={19} />}
            isOpen={openSection === "users"}
            onToggle={(id) => setOpenSection(id as typeof openSection)}
          >
            <UserManagementSection
              users={filteredUsers}
              loading={loadingUsers}
              updatingUserId={updatingUserId}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onRoleChange={handleRoleChange}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="admin-community"
            title="Minha comunidade"
            description="Altere a comunidade vinculada ao seu usuário super admin."
            icon={<Circle size={19} />}
            isOpen={openSection === "admin-community"}
            onToggle={(id) => setOpenSection(id as typeof openSection)}
          >
            <div className="flex flex-col gap-3 md:flex-row">
              <select
                value={adminCommunity}
                onChange={(e) => setAdminCommunity(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              >
                <option value="">Selecione a comunidade</option>
                {communities.map((community) => (
                  <option key={community.key} value={community.key}>{community.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleSaveAdminCommunity()}
                disabled={!adminCommunity || savingAdminCommunity}
                className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingAdminCommunity ? "Salvando..." : "Atualizar comunidade"}
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="communities"
            title="Comunidades"
            description="Visualize comunidades cadastradas."
            icon={<Building2 size={19} />}
            isOpen={openSection === "communities"}
            onToggle={(id) => setOpenSection(id as typeof openSection)}
          >
            {loadingCommunities ? <div className="text-zinc-300">Carregando comunidades...</div> : null}
            {!loadingCommunities ? (
              <div className="grid grid-cols-1 divide-y divide-zinc-800">
                {communities.map((item) => (
                  <div key={item.key} className="py-4">
                    <p className="text-base font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-zinc-400">key: {item.key}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </CollapsibleSection>
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
