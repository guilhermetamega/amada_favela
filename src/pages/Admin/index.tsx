import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getPresidentManageableUsers,
  updateUserRoleAsPresident,
} from "@/services/supabase/admin";
import type { ManageableUser } from "@/types/admin";

export default function AdminPage() {
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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

  return (
    <DashboardLayout>
      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white">Administração</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Gerencie usuários da sua comunidade.
            </p>
          </header>

          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Carregando usuários...
            </div>
          ) : null}

          {!loading && errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {!loading && users.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Nenhum usuário disponível para gerenciamento.
            </div>
          ) : null}

          {!loading && users.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <div className="grid grid-cols-1 divide-y divide-zinc-800">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {user.fullname}
                      </h2>
                      <p className="text-sm text-zinc-400">{user.email}</p>
                      <p className="text-sm text-zinc-400">
                        Comunidade: {user.comunity || "Não informada"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          void handleRoleChange(
                            user.id,
                            event.target.value as "user" | "employee",
                          )
                        }
                        disabled={updatingUserId === user.id}
                        className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-zinc-500 disabled:opacity-60"
                      >
                        <option value="user">User</option>
                        <option value="employee">Employee</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
