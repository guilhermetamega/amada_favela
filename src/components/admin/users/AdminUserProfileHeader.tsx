import { KeyRound, ShieldAlert } from "lucide-react";
import AdminMembershipStatusBadge from "./AdminMembershipStatusBadge";
import AdminUserRoleBadge from "./AdminUserRoleBadge";
import type { AdminUserDetailResponse } from "@/types/admin-user-detail";
import { formatDate, formatPhone } from "@/utils/formatters";

type AdminUserProfileHeaderProps = {
  detail: AdminUserDetailResponse;
};

function getInitials(fullname: string) {
  return fullname
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function AdminUserProfileHeader({
  detail,
}: AdminUserProfileHeaderProps) {
  const { profile } = detail;

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-24 bg-linear-to-r from-cyan-600 via-sky-600 to-violet-600" />

      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-zinc-900 text-2xl font-black text-white shadow-lg dark:border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900">
              {getInitials(profile.fullname)}
            </div>

            <div className="pb-1">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {profile.fullname}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {formatPhone(profile.phone)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminUserRoleBadge role={profile.role} />

            <AdminMembershipStatusBadge status={profile.membershipStatus} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-zinc-200 pt-5 sm:grid-cols-3 dark:border-zinc-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Comunidade
            </p>

            <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">
              {profile.communityLabel}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Cadastro
            </p>

            <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">
              {formatDate(profile.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Segurança
            </p>

            <div className="mt-1 flex justify-center items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
              {profile.passwordChangeRequired ? (
                <>
                  <ShieldAlert size={17} className="text-amber-500" />
                  Troca de senha pendente
                </>
              ) : (
                <>
                  <KeyRound size={17} className="text-emerald-500" />
                  Acesso regular
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
