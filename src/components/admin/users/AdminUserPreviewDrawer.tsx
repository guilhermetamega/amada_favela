import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Phone,
  ReceiptText,
  WalletCards,
  X,
} from "lucide-react";
import AdminMembershipStatusBadge from "./AdminMembershipStatusBadge";
import AdminUserRoleBadge from "./AdminUserRoleBadge";
import type { AdminUserListItem } from "@/types/admin-users";
import {
  formatCurrencyFromCents,
  formatDate,
  formatDateTime,
  formatPhone,
} from "@/utils/formatters";

type AdminUserPreviewDrawerProps = {
  user: AdminUserListItem | null;
  onClose: () => void;
};

export default function AdminUserPreviewDrawer({
  user,
  onClose,
}: AdminUserPreviewDrawerProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, user]);

  if (!user) return null;

  const address = [user.address1, user.addressNumber]
    .filter(Boolean)
    .join(", ");

  function openFullProfile() {
    onClose();

    navigate(`/admin/users/${user?.id}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-preview-title"
        className="ml-auto flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl dark:bg-zinc-950"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Resumo do usuário
            </p>

            <h2
              id="admin-user-preview-title"
              className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100"
            >
              {user.fullname}
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <AdminUserRoleBadge role={user.role} />

              <AdminMembershipStatusBadge status={user.membershipStatus} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Fechar resumo"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
              Dados principais
            </h3>

            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 text-cyan-600" />

                <div>
                  <p className="text-xs text-zinc-500">Telefone</p>

                  <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {formatPhone(user.phone)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-cyan-600" />

                <div>
                  <p className="text-xs text-zinc-500">Endereço</p>

                  <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {address}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {user.communityLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays size={18} className="mt-0.5 text-cyan-600" />

                <div>
                  <p className="text-xs text-zinc-500">Cadastro</p>

                  <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {formatDateTime(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
              <WalletCards size={20} className="text-emerald-600" />

              <p className="mt-4 text-xs text-zinc-500">Total contribuído</p>

              <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrencyFromCents(user.totalContributedCents)}
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
              <ReceiptText size={20} className="text-violet-600" />

              <p className="mt-4 text-xs text-zinc-500">Pagamentos aprovados</p>

              <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {user.approvedPaymentsCount}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
              Histórico financeiro
            </h3>

            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-zinc-500">Primeiro pagamento</dt>

                <dd className="text-right text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {user.firstPaymentAt
                    ? formatDate(user.firstPaymentAt)
                    : "Nenhum"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-zinc-500">Último pagamento</dt>

                <dd className="text-right text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {user.lastPaymentAt
                    ? formatDate(user.lastPaymentAt)
                    : "Nenhum"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-zinc-500">Vencimento atual</dt>

                <dd className="text-right text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {user.partnerExpiresAt
                    ? formatDate(user.partnerExpiresAt)
                    : "Sem vínculo ativo"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <footer className="border-t border-zinc-200 p-5 dark:border-zinc-800">
          <button
            type="button"
            onClick={openFullProfile}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3.5 font-semibold text-white transition hover:bg-cyan-700"
          >
            Abrir perfil completo
            <ArrowRight size={18} />
          </button>
        </footer>
      </aside>
    </div>
  );
}
