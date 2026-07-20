import type { AdminMembershipStatus } from "@/types/admin-users";

type AdminMembershipStatusBadgeProps = {
  status: AdminMembershipStatus;
};

const labels: Record<AdminMembershipStatus, string> = {
  active: "Sócio ativo",
  expiring_soon: "Próximo do vencimento",
  past_due: "Inadimplente",
  former_member: "Ex-sócio",
  paid_once: "Pagou uma vez",
  never_paid: "Nunca pagou",
};

const styles: Record<AdminMembershipStatus, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",

  expiring_soon:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",

  past_due:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",

  former_member:
    "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",

  paid_once:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",

  never_paid:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
};

export default function AdminMembershipStatusBadge({
  status,
}: AdminMembershipStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[status],
      ].join(" ")}
    >
      {labels[status]}
    </span>
  );
}
