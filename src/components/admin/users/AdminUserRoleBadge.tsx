import type { UserRole } from "@/lib/permissions";

type AdminUserRoleBadgeProps = {
  role: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  user: "Usuário",
  employee: "Funcionário",
  president: "Presidente",
  admin: "Administrador",
};

const roleStyles: Record<UserRole, string> = {
  user: "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",

  employee:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300",

  president:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",

  admin:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export default function AdminUserRoleBadge({ role }: AdminUserRoleBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        roleStyles[role],
      ].join(" ")}
    >
      {roleLabels[role]}
    </span>
  );
}
