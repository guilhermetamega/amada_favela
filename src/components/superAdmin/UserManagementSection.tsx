import { LoaderCircle } from "lucide-react";
import type { ManageableUser, UserRole } from "@/types/admin";

type Props = {
  users: ManageableUser[];
  loading: boolean;
  updatingUserId: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (userId: string, role: Extract<UserRole, "user" | "employee" | "president">) => void;
};

export default function UserManagementSection({
  users,
  loading,
  updatingUserId,
  searchTerm,
  onSearchChange,
  onRoleChange,
}: Props) {
  return (
    <div className="space-y-4">
      <input
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar usuário por nome"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
      />

      {loading ? <div className="text-zinc-300">Carregando usuários...</div> : null}
      {!loading && users.length === 0 ? (
        <div className="text-zinc-300">Nenhum usuário encontrado.</div>
      ) : null}

      {!loading && users.length > 0 ? (
        <div className="grid grid-cols-1 divide-y divide-zinc-800">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{user.fullname}</h3>
                <p className="text-sm text-zinc-400">{user.email}</p>
                <p className="text-sm text-zinc-400">Comunidade: {user.comunity || "Não informada"}</p>
              </div>

              <select
                value={user.role}
                onChange={(event) =>
                  onRoleChange(
                    user.id,
                    event.target.value as Extract<UserRole, "user" | "employee" | "president">,
                  )
                }
                disabled={updatingUserId === user.id}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-zinc-500 disabled:opacity-60"
              >
                <option value="user">Usuário</option>
                <option value="employee">Funcionário</option>
                <option value="president">Presidente</option>
              </select>
              {updatingUserId === user.id ? <LoaderCircle size={16} className="animate-spin text-zinc-300" /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
