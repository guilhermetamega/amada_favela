import { CheckCircle2, Clock3, LoaderCircle, QrCode } from "lucide-react";

type Props = {
  loading: boolean;
  hasOpenPix: boolean;
  disabled: boolean;
  onClick: () => void;
};

export default function PartnerPixButton({
  loading,
  hasOpenPix,
  disabled,
  onClick,
}: Props) {
  const label = disabled
    ? "Mensalidade ativa"
    : loading
      ? "Gerando Pix..."
      : hasOpenPix
        ? "Abrir Pix"
        : "Apoiar com Pix";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:min-w-55 ${
        loading || disabled
          ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
          : "border border-emerald-300/80 bg-linear-to-r from-emerald-300 via-lime-200 to-green-200 text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,0.18)] hover:-translate-y-0.2 hover:shadow-[0_18px_36px_rgba(16,185,129,0.24)] dark:border-emerald-300/20 dark:from-emerald-300 dark:via-lime-200 dark:to-green-200 dark:text-emerald-950"
      }`}
    >
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : disabled ? (
        <CheckCircle2 size={16} />
      ) : hasOpenPix ? (
        <Clock3 size={16} />
      ) : (
        <QrCode size={16} />
      )}

      {label}
    </button>
  );
}
