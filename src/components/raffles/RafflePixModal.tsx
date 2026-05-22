import { useMemo, useState } from "react";

type RafflePixData = {
  checkoutCode: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  totalCents: number;
};

export default function RafflePixModal({ open, pixData, onClose }: { open: boolean; pixData: RafflePixData | null; onClose: () => void; }) {
  const [copied, setCopied] = useState(false);
  const qrImageSrc = useMemo(() => {
    if (!pixData?.qrCodeBase64) return null;
    return pixData.qrCodeBase64.startsWith("data:image") ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`;
  }, [pixData?.qrCodeBase64]);

  async function handleCopy() {
    if (!pixData?.qrCode) return;
    await navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-[28px] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Pagamento Pix gerado</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Valor: R$ {((pixData?.totalCents ?? 0) / 100).toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1 text-sm">Fechar</button>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_220px]">
          <div>
            <p className="mb-2 text-sm font-medium">Pix copia e cola</p>
            <textarea readOnly value={pixData?.qrCode ?? "Código Pix indisponível."} className="min-h-32 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-800" />
            <div className="mt-3 flex gap-2">
              <button onClick={handleCopy} disabled={!pixData?.qrCode} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900">{copied ? "Copiado!" : "Copiar código"}</button>
              {pixData?.ticketUrl ? <a href={pixData.ticketUrl} target="_blank" rel="noreferrer" className="rounded-xl border px-4 py-2 text-sm">Abrir Pix</a> : null}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">QR Code Pix</p>
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800">
              {qrImageSrc ? <img src={qrImageSrc} alt="QR Code Pix" className="h-52 w-52 rounded-lg" /> : <span className="text-xs text-zinc-500">QR code indisponível</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
