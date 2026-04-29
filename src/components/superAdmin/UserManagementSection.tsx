import { Search } from "lucide-react";
import type { ManageableUser, UserRole } from "@/types/admin";

type Props = {
  users: ManageableUser[];
  loading: boolean;
  updatingUserId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (userId: string, role: "user" | "employee" | "president") => void;
  onCommunityChange: (userId: string, community: string) => void;
};

export default function UserManagementSection({ users, loading, updatingUserId, search, onSearchChange, onRoleChange, onCommunityChange }: Props) {
  if (loading) return <div className="text-zinc-300">Carregando usuários...</div>;
  if (!users.length) return <div className="text-zinc-300">Nenhum usuário disponível para gerenciamento.</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-3 text-zinc-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Pesquisar por nome"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100"
        />
      </div>

      <div className="grid grid-cols-1 divide-y divide-zinc-800">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{user.fullname}</h3>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <p className="text-sm text-zinc-400">Comunidade: {user.comunity || "Não informada"}</p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <select
                value={user.role}
                onChange={(event) => onRoleChange(user.id, event.target.value as UserRole as "user" | "employee" | "president")}
                disabled={updatingUserId === user.id}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-white"
              >
                <option value="user">Usuário</option>
                <option value="employee">Funcionário</option>
                <option value="president">Presidente</option>
              </select>
              <input
                defaultValue={user.comunity ?? ""}
                onBlur={(event) => onCommunityChange(user.id, event.target.value)}
                placeholder="Atualizar community e sair do campo"
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
