import { Eye, MapPin, Phone, WalletCards } from "lucide-react";
import AdminMembershipStatusBadge from "./AdminMembershipStatusBadge";
import AdminUserRoleBadge from "./AdminUserRoleBadge";
import type { AdminUserListItem } from "@/types/admin-users";
import {
  formatCurrencyFromCents,
  formatDate,
  formatPhone,
} from "@/utils/formatters";

type AdminUsersListProps = {
  users: AdminUserListItem[];
  loading: boolean;
  refreshing: boolean;
  onOpenUser: (user: AdminUserListItem) => void;
};

function getAddress(user: AdminUserListItem) {
  return [user.address1, user.addressNumber].filter(Boolean).join(", ");
}

function UserListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}

export default function AdminUsersList({
  users,
  loading,
  refreshing,
  onOpenUser,
}: AdminUsersListProps) {
  if (loading) {
    return (
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <UserListSkeleton />
      </section>
    );
  }

  if (users.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-zinc-300 bg-white px-5 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <WalletCards size={25} />
        </div>

        <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Nenhum usuário encontrado
        </h2>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Ajuste os filtros para ampliar a pesquisa.
        </p>
      </section>
    );
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900",
        refreshing ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-245 border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-950/50">
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Usuário
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Endereço
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Associação
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Pagamentos
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Último pagamento
              </th>

              <th className="w-24 px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-zinc-500">
                Ação
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-zinc-100 transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/70 dark:hover:bg-zinc-800/40"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {user.fullname}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <AdminUserRoleBadge role={user.role} />

                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <Phone size={13} />
                      {formatPhone(user.phone)}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex max-w-64 items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    {getAddress(user)}
                  </div>

                  <p className="mt-1 text-xs text-zinc-400">
                    {user.communityLabel}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <AdminMembershipStatusBadge status={user.membershipStatus} />

                  {user.partnerExpiresAt ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      Vence em {formatDate(user.partnerExpiresAt)}
                    </p>
                  ) : null}
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrencyFromCents(user.totalContributedCents)}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {user.approvedPaymentsCount}{" "}
                    {user.approvedPaymentsCount === 1
                      ? "pagamento"
                      : "pagamentos"}
                  </p>
                </td>

                <td className="px-5 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {user.lastPaymentAt
                    ? formatDate(user.lastPaymentAt)
                    : "Nenhum pagamento"}
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenUser(user)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
                    aria-label={`Visualizar ${user.fullname}`}
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-zinc-200 md:hidden dark:divide-zinc-800">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onOpenUser(user)}
            className="block w-full p-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.fullname}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {formatPhone(user.phone)}
                </p>
              </div>

              <Eye size={18} className="mt-1 shrink-0 text-zinc-400" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <AdminUserRoleBadge role={user.role} />

              <AdminMembershipStatusBadge status={user.membershipStatus} />
            </div>

            <div className="mt-4 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              {getAddress(user)}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/60">
              <div>
                <p className="text-xs text-zinc-500">Contribuído</p>

                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrencyFromCents(user.totalContributedCents)}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">Pagamentos</p>

                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.approvedPaymentsCount}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
