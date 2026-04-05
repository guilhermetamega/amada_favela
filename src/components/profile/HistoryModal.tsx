import { X } from "lucide-react";
import type { PartnerHistoryItem } from "@/types/profile";

type Props = {
  open: boolean;
  items: PartnerHistoryItem[];
  onClose: () => void;
};

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function isPartnerHistoryItemActive(item: PartnerHistoryItem) {
  const expiresAt = new Date(item.expires_at);
  const notExpired = expiresAt.getTime() >= Date.now();

  if (!notExpired) {
    return false;
  }

  if (item.status === "expired" || item.status === "cancelled") {
    return false;
  }

  return true;
}

export default function PartnerHistoryModal({ open, items, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          {/* botão fechar */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <X size={18} />
          </button>

          {/* título centralizado */}
          <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center">
            <h2 className="text-base font-semibold text-zinc-950 sm:text-lg dark:text-zinc-50">
              Histórico de mensalidades
            </h2>

            <p className="hidden text-sm text-zinc-500 sm:block dark:text-zinc-400">
              Histórico completo do vínculo de sócio
            </p>
          </div>

          {/* spacer para manter simetria */}
          <div className="h-10 w-10" />
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="space-y-3">
            {items.map((item) => {
              const active = isPartnerHistoryItemActive(item);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Pago em {formatDate(item.created_at)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Válido até {formatDate(item.expires_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      }`}
                    >
                      {active ? "Ativo" : "Expirado"}
                    </span>
                  </div>
                </div>
              );
            })}

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Nenhum histórico encontrado.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
