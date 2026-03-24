import { CreditCard } from "lucide-react";
import type { PartnerHistoryItem } from "@/types/profile";

type Props = {
  partnerHistory: PartnerHistoryItem[];
  hasActivePartner: boolean;
  partnerBadge: { label: string; className: string };
  onPayMonthlyFeeClick: () => void;
  onOpenHistory: () => void;
};

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function ProfilePartnerSection({
  partnerHistory,
  hasActivePartner,
  partnerBadge,
  onPayMonthlyFeeClick,
  onOpenHistory,
}: Props) {
  const preview = partnerHistory.slice(0, 3);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Situação de sócio
        </h2>

        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Histórico e situação atual da mensalidade.
        </p>

        <div className="mt-3 flex justify-center">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${partnerBadge.className}`}
          >
            {partnerBadge.label}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {preview.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-200 p-4 text-center dark:border-zinc-800"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pago em {formatDate(item.created_at)}
            </p>

            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Válido até {formatDate(item.expires_at)}
            </p>
          </div>
        ))}

        {preview.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Você ainda não possui histórico de mensalidades.
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onPayMonthlyFeeClick}
          disabled={hasActivePartner}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:min-w-55 ${
            hasActivePartner
              ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          <CreditCard size={16} />
          {hasActivePartner ? "Mensalidade ativa" : "Pagar mensalidade"}
        </button>

        {partnerHistory.length > 3 ? (
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:min-w-55 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Ver histórico completo
          </button>
        ) : null}
      </div>
    </section>
  );
}
