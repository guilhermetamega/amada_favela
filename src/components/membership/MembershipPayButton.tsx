import { useState } from "react";
import { CreditCard, LoaderCircle } from "lucide-react";
import { createMembershipCheckout } from "@/services/supabase/membership";
import { openExternalUrl } from "@/lib/open-external-url";

type Props = {
  recurring?: boolean;
  className?: string;
  compact?: boolean;
  loadingLabel?: string;
  recurringLabel?: string;
  singlePaymentLabel?: string;
};

export default function MembershipPayButton({
  recurring = true,
  className = "",
  compact = false,
  loadingLabel = "Abrindo checkout...",
  recurringLabel = "Pagar mensalidade",
  singlePaymentLabel = "Pagar mensalidade avulsa",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handlePay() {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const { url } = await createMembershipCheckout(recurring);
      openExternalUrl(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Falha ao abrir pagamento.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => {
          void handlePay();
        }}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? "px-4 py-2.5 text-sm" : "px-5 py-3"
        }`}
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {loading
          ? loadingLabel
          : recurring
            ? recurringLabel
            : singlePaymentLabel}
      </button>

      {errorMessage ? (
        <p className="text-sm text-red-500 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}
