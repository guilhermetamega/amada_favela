import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  QrCode,
  X,
} from "lucide-react";
import type { MembershipPixCheckout } from "@/services/supabase/mercadopago";

type Props = {
  open: boolean;
  loading: boolean;
  errorMessage: string;
  pixData: MembershipPixCheckout | null;
  onClose: () => void;
  onGeneratePix: () => void;
};

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(pixData: MembershipPixCheckout | null) {
  if (!pixData) return "Aguardando geração";

  if (pixData.status === "succeeded") return "Sucesso";
  if (pixData.status === "failed") return "Falhou";
  if (pixData.status === "cancelled") return "Cancelado";
  if (pixData.status === "processing") return "Processando";
  if (pixData.status === "requires_action") return "Aguardando ação";

  if (pixData.providerStatusDetail === "pending_waiting_transfer") {
    return "Pagamento recebido, aguardando transferência";
  }

  if (pixData.providerStatus) return pixData.providerStatus;
  return pixData.status;
}

export default function PartnerPixModal({
  open,
  loading,
  errorMessage,
  pixData,
  onClose,
  onGeneratePix,
}: Props) {
  const [copied, setCopied] = useState(false);

  const isSuccess = pixData?.status === "succeeded";

  const qrCodeImageSrc = useMemo(() => {
    if (!pixData?.qrCodeBase64) return null;

    if (pixData.qrCodeBase64.startsWith("data:image")) {
      return pixData.qrCodeBase64;
    }

    return `data:image/png;base64,${pixData.qrCodeBase64}`;
  }, [pixData?.qrCodeBase64]);

  async function handleCopyPixCode() {
    if (!pixData?.qrCode) return;

    await navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-zinc-950/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Apoiar com Pix
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Gere um Pix para apoiar sua associação.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
            <div className="space-y-4">
              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              {!pixData ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center dark:border-zinc-700">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <QrCode size={24} />
                  </div>

                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Clique abaixo para gerar o QR Code Pix da mensalidade.
                  </p>

                  <button
                    type="button"
                    onClick={onGeneratePix}
                    disabled={loading}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <QrCode size={16} />
                    )}

                    {loading ? "Gerando Pix..." : "Gerar Pix"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`rounded-2xl border p-4 ${
                      isSuccess
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Status
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {getStatusLabel(pixData)}
                        </p>
                      </div>

                      {isSuccess ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <CheckCircle2 size={14} />
                          Confirmado
                        </div>
                      ) : null}
                    </div>

                    {pixData.providerStatusDetail ? (
                      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {pixData.providerStatusDetail}
                      </p>
                    ) : null}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Expira em
                        </p>
                        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {formatDate(pixData.expiresAt)}
                        </p>
                      </div>

                      {pixData.paidAt ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Pago em
                          </p>
                          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                            {formatDate(pixData.paidAt)}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {isSuccess ? (
                      <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Pagamento confirmado. O modal será fechado em instantes.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Pix copia e cola
                    </p>

                    <div className="rounded-2xl bg-zinc-100 p-3 text-xs break-all text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {pixData.qrCode || "Código Pix não disponível."}
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleCopyPixCode}
                        disabled={!pixData.qrCode}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Copy size={16} />
                        {copied ? "Copiado!" : "Copiar código"}
                      </button>

                      {pixData.ticketUrl ? (
                        <a
                          href={pixData.ticketUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                        >
                          <ExternalLink size={16} />
                          Abrir Pix
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {!isSuccess ? (
                    <button
                      type="button"
                      onClick={onGeneratePix}
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {loading ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <QrCode size={16} />
                      )}

                      {loading ? "Atualizando..." : "Gerar / reabrir Pix"}
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-0">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  QR Code Pix
                </p>

                <div className="mt-4 flex min-h-70 items-center justify-center rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  {qrCodeImageSrc ? (
                    <img
                      src={qrCodeImageSrc}
                      alt="QR Code Pix"
                      className="mx-auto h-64 w-64 max-w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        <QrCode size={24} />
                      </div>
                      <p className="mt-4">
                        O QR Code aparecerá aqui assim que o Pix for gerado.
                      </p>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  No desktop, você pode escanear o QR Code com o app do banco.
                  No celular, use também o código copia e cola.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
