import { Clock3, CreditCard, LoaderCircle } from "lucide-react";
import PartnerPixButton from "@/components/profile/PartnerPixButton";
import type { PartnerHistoryItem } from "@/types/profile";

type Props = {
  partnerHistory: PartnerHistoryItem[];
  partnerBadge: { label: string; className: string };
  showStripe: boolean;
  showMercadoPago: boolean;
  loadingPaymentMethods: boolean;
  payingMonthlyFee: boolean;
  hasOpenMembershipPayment: boolean;
  openMembershipPaymentStatus:
    | "pending"
    | "processing"
    | "requires_action"
    | null;
  loadingOpenMembershipPayment: boolean;
  onPayMonthlyFeeClick: () => void;
  months: number;
  onMonthsChange: (months: number) => void;
  latestExpiry: string | null;
  onOpenHistory: () => void;

  loadingPixPayment: boolean;
  hasOpenPixPayment: boolean;
  onOpenPixModal: () => void;
};

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function ProfilePartnerSection({
  partnerHistory,
  partnerBadge,
  showStripe,
  showMercadoPago,
  loadingPaymentMethods,
  payingMonthlyFee,
  hasOpenMembershipPayment,
  openMembershipPaymentStatus,
  loadingOpenMembershipPayment,
  onPayMonthlyFeeClick,
  months,
  onMonthsChange,
  latestExpiry,
  onOpenHistory,
  loadingPixPayment,
  hasOpenPixPayment,
  onOpenPixModal,
}: Props) {
  const preview = partnerHistory.slice(0, 3);
  const membershipExpired = latestExpiry
    ? new Date(latestExpiry).getTime() < Date.now()
    : false;

  const payDisabled =
    payingMonthlyFee ||
    hasOpenMembershipPayment ||
    loadingOpenMembershipPayment;

  const pixDisabled = loadingPixPayment;

  const buttonLabel = payingMonthlyFee
    ? "Abrindo checkout..."
    : hasOpenMembershipPayment
      ? "Processando pagamento"
    : "Continuar apoio";

  const helperLabel = hasOpenMembershipPayment
    ? openMembershipPaymentStatus === "requires_action"
      ? "Existe uma cobrança que ainda requer ação ou confirmação."
      : "Existe uma cobrança em aberto. Aguarde a confirmação antes de tentar novamente."
    : null;

  return (
    <section
      id="partner-section"
      className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
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
        {latestExpiry ? (
          <div
            className={`rounded-2xl border p-4 text-center ${
              membershipExpired
                ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                : "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
            }`}
          >
            <p
              className={`text-xs font-medium uppercase tracking-wide ${
                membershipExpired
                  ? "text-red-700 dark:text-red-300"
                  : "text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {membershipExpired ? "Expirado em" : "Validade atual até"}
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                membershipExpired
                  ? "text-red-800 dark:text-red-200"
                  : "text-emerald-800 dark:text-emerald-200"
              }`}
            >
              {formatDate(latestExpiry)}
            </p>
          </div>
        ) : null}
        {preview.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-200 p-4 text-center dark:border-zinc-800"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pago em {formatDate(item.created_at)}
            </p>

            {item.expires_at === latestExpiry ? null : (
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Válido até {formatDate(item.expires_at)}
              </p>
            )}
          </div>
        ))}

        {preview.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Você ainda não possui histórico de mensalidades.
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {loadingPaymentMethods ? (
          <div
            role="status"
            aria-label="Verificando meios de pagamento"
            className="flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <LoaderCircle
              size={16}
              className="animate-spin text-zinc-500 dark:text-zinc-400"
            />
            <span className="h-3 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <span className="sr-only">Verificando meios de pagamento</span>
          </div>
        ) : null}
        {!loadingPaymentMethods && (showStripe || showMercadoPago) ? (
          <label className="flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            Pagar adiantado
            <select
              value={months}
              onChange={(event) => onMonthsChange(Number(event.target.value))}
              disabled={payDisabled}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "mês" : "meses"}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {!loadingPaymentMethods && showStripe ? (
          <button
            type="button"
            onClick={onPayMonthlyFeeClick}
            disabled={payDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:min-w-55 ${
              payDisabled
                ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                : "border border-amber-300/80 bg-linear-to-r from-amber-300 via-yellow-300 to-orange-300 text-amber-950 shadow-[0_12px_30px_rgba(251,191,36,0.22)] hover:-translate-y-0.2 hover:shadow-[0_18px_36px_rgba(251,191,36,0.28)] dark:border-amber-300/20 dark:from-amber-300 dark:via-yellow-200 dark:to-orange-200 dark:text-amber-950"
            }`}
          >
            {payingMonthlyFee ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : hasOpenMembershipPayment ? (
              <Clock3 size={16} />
            ) : (
              <CreditCard size={16} />
            )}

            {buttonLabel}
          </button>
        ) : null}

        {!loadingPaymentMethods && showMercadoPago ? (
          <PartnerPixButton
            loading={loadingPixPayment}
            hasOpenPix={hasOpenPixPayment}
            disabled={pixDisabled}
            onClick={onOpenPixModal}
          />
        ) : null}

        {!loadingPaymentMethods && !showStripe && !showMercadoPago ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Os pagamentos ainda não estão disponíveis para esta associação.
          </p>
        ) : null}

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

      {helperLabel ? (
        <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {helperLabel}
        </p>
      ) : null}
    </section>
  );
}
