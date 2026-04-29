import { LoaderCircle, Users } from "lucide-react";
import type { CommunityData } from "@/types/community";
import type { ManageableUser, UserRole } from "@/types/admin";
import SectionCard from "./SectionCard";

type UsersSectionProps = {
  id: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  users: ManageableUser[];
  communities: CommunityData[];
  loading: boolean;
  updatingUserId: string | null;
  searchText: string;
  selectedCommunity: string;
  onSearchTextChange: (value: string) => void;
  onCommunityFilterChange: (value: string) => void;
  onRoleChange: (userId: string, role: Extract<UserRole, "user" | "employee" | "president">) => void;
  onUserCommunityChange: (userId: string, communityKey: string) => void;
};

export default function UsersSection(props: UsersSectionProps) {
  const activeCommunities = props.communities.filter((item) => item.active);

  return (
    <SectionCard
      id={props.id}
      title="Usuários globais"
      description="Gerencie roles e comunidade de moradores, funcionários e presidentes."
      icon={<Users size={19} />}
      isOpen={props.isOpen}
      onToggle={props.onToggle}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Buscar por nome
          <input
            value={props.searchText}
            onChange={(e) => props.onSearchTextChange(e.target.value)}
            placeholder="Ex: Maria"
            className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Filtrar por comunidade ativa
          <select
            value={props.selectedCommunity}
            onChange={(e) => props.onCommunityFilterChange(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todas</option>
            {activeCommunities.map((community) => (
              <option key={community.key} value={community.key}>
                {community.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {props.loading ? <div className="text-zinc-300">Carregando usuários...</div> : null}
      {!props.loading && props.users.length === 0 ? <div className="text-zinc-500 dark:text-zinc-300">Nenhum usuário disponível para o filtro atual.</div> : null}

      {!props.loading && props.users.length > 0 ? (
        <div className="grid grid-cols-1 divide-y divide-zinc-200 dark:divide-zinc-800">
          {props.users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white md:text-lg">{user.fullname}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Comunidade atual: {user.comunity || "Não informada"}</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  aria-label={`Alterar role de ${user.fullname}`}
                  value={user.role}
                  onChange={(event) => props.onRoleChange(user.id, event.target.value as Extract<UserRole, "user" | "employee" | "president">)}
                  disabled={props.updatingUserId === user.id}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-violet-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="user">Usuário</option>
                  <option value="employee">Funcionário</option>
                  <option value="president">Presidente</option>
                </select>

                <select
                  aria-label={`Alterar comunidade de ${user.fullname}`}
                  value={user.comunity ?? ""}
                  onChange={(event) => props.onUserCommunityChange(user.id, event.target.value)}
                  disabled={props.updatingUserId === user.id}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-violet-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">Sem comunidade</option>
                  {activeCommunities.map((community) => (
                    <option key={community.key} value={community.key}>
                      {community.label}
                    </option>
                  ))}
                </select>
              </div>

              {props.updatingUserId === user.id ? <LoaderCircle size={16} className="animate-spin text-zinc-500" /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
