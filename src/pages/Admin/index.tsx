import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/Layout";
import {
  getPresidentManageableUsers,
  updateUserRoleAsPresident,
} from "@/services/supabase/admin";
import type { ManageableUser } from "@/types/admin";
import DashboardHeader from "@/components/layout/DashboardHeader";

type ManageUsersModalProps = {
  isOpen: boolean;
  users: ManageableUser[];
  loading: boolean;
  errorMessage: string;
  updatingUserId: string | null;
  onClose: () => void;
  onRoleChange: (userId: string, newRole: "user" | "employee") => Promise<void>;
};

function ManageUsersModal({
  isOpen,
  users,
  loading,
  errorMessage,
  updatingUserId,
  onClose,
  onRoleChange,
}: ManageUsersModalProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) return users;

    return users.filter((user) => {
      const fullname = user.fullname?.toLowerCase() ?? "";
      const email = user.email?.toLowerCase() ?? "";
      const comunity = user.comunity?.toLowerCase() ?? "";

      return (
        fullname.includes(normalized) ||
        email.includes(normalized) ||
        comunity.includes(normalized)
      );
    });
  }, [search, users]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Gerenciar Usuários
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Altere a função de usuários e funcionários da sua comunidade.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>

        <div className="border-b border-zinc-800 p-6">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome, e-mail ou comunidade..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
          />
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
              Carregando usuários...
            </div>
          ) : null}

          {!loading && errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {!loading && !errorMessage && filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
              Nenhum usuário disponível para gerenciamento.
            </div>
          ) : null}

          {!loading && !errorMessage && filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {user.fullname}
                    </h3>
                    <p className="text-sm text-zinc-400">{user.email}</p>
                    <p className="text-sm text-zinc-400">
                      Comunidade: {user.comunity || "Não informada"}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Cargo atual:{" "}
                      <span className="text-zinc-200">
                        {user.role === "user" ? "Usuário" : "Funcionário"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        void onRoleChange(
                          user.id,
                          event.target.value as "user" | "employee",
                        )
                      }
                      disabled={updatingUserId === user.id}
                      className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-zinc-500 disabled:opacity-60"
                    >
                      <option value="user">Usuário</option>
                      <option value="employee">Funcionário</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getPresidentManageableUsers();
        setUsers(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar usuários.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    void loadUsers();
  }, []);

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
      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <DashboardHeader
            title="Administração"
            description="Gerencie funções administrativas e recursos da sua comunidade."
            showBackButton
          />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setIsUsersModalOpen(true)}
              className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Gerenciar usuários
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Altere funções entre Usuário e Funcionário sem sair desta
                    tela.
                  </p>
                </div>

                <div className="space-y-1 text-sm text-zinc-300">
                  <p>Usuários: {loading ? "..." : totalUsers}</p>
                  <p>Funcionários: {loading ? "..." : totalEmployees}</p>
                  <p className="pt-2 font-medium">Abrir gerenciamento →</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard/admin/mail")}
              className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Notificação de cartas
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Visualize usuários parceiros e registre novas cartas
                    recebidas.
                  </p>
                </div>

                <span className="text-sm font-medium text-zinc-300">
                  Abrir módulo →
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard/admin/social-projects")}
              className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Projetos Sociais
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Cadastre, edite e remova projetos sociais da comunidade.
                  </p>
                </div>

                <span className="text-sm font-medium text-zinc-300">
                  Abrir módulo →
                </span>
              </div>
            </button>

            <div className="aspect-square rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">WIP</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Espaço reservado para novas funções administrativas.
                  </p>
                </div>

                <span className="text-sm font-medium text-zinc-500">
                  Em desenvolvimento
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ManageUsersModal
        isOpen={isUsersModalOpen}
        users={users}
        loading={loading}
        errorMessage={errorMessage}
        updatingUserId={updatingUserId}
        onClose={() => setIsUsersModalOpen(false)}
        onRoleChange={handleRoleChange}
      />
    </DashboardLayout>
  );
}
