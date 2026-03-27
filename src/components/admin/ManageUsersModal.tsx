import { useMemo, useState } from "react";
import type { ManageableUser } from "@/types/admin";

type ManageUsersModalProps = {
  isOpen: boolean;
  users: ManageableUser[];
  loading: boolean;
  errorMessage: string;
  updatingUserId: string | null;
  onClose: () => void;
  onRoleChange: (userId: string, newRole: "user" | "employee") => Promise<void>;
};

export default function ManageUsersModal({
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
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      const fullName = user.fullname?.toLowerCase() ?? "";
      const email = user.email?.toLowerCase() ?? "";
      const community = user.comunity?.toLowerCase() ?? "";

      return (
        fullName.includes(term) ||
        email.includes(term) ||
        community.includes(term)
      );
    });
  }, [search, users]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
        <div
          className="
            flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl
            border border-zinc-200 bg-white shadow-2xl
            max-h-[calc(100dvh-2rem-env(safe-area-inset-bottom))]
            sm:max-h-[88vh]
            dark:border-zinc-800 dark:bg-zinc-900
          "
        >
          <div className="relative border-b border-zinc-200 px-4 py-5 sm:px-6 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Fechar
            </button>

            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
                Gerenciar usuários
              </h2>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="mt-4 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {loading ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Carregando usuários...
              </div>
            ) : null}

            {!loading && errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
                {errorMessage}
              </div>
            ) : null}

            {!loading && !errorMessage && filteredUsers.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Nenhum usuário disponível para gerenciamento.
              </div>
            ) : null}

            {!loading && !errorMessage && filteredUsers.length > 0 ? (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <article
                    key={user.id}
                    className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 text-center sm:text-left">
                        <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {user.fullname}
                        </h3>
                        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                          {user.email}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Cargo atual:{" "}
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {user.role === "employee"
                              ? "Funcionário"
                              : "Usuário"}
                          </span>
                        </p>
                      </div>

                      <select
                        value={user.role}
                        onChange={(event) => {
                          const nextRole = event.target.value;

                          if (nextRole !== "user" && nextRole !== "employee") {
                            return;
                          }

                          void onRoleChange(user.id, nextRole);
                        }}
                        disabled={updatingUserId === user.id}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 disabled:opacity-60 sm:w-48 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        <option value="user">Usuário</option>
                        <option value="employee">Funcionário</option>
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
