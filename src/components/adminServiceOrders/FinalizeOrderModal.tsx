type Props = {
  open: boolean;
  title: string;
  count: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function FinalizeOrderModal({
  open,
  title,
  count,
  loading,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Finalizar ordem
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Você está finalizando <strong>{title}</strong> com{" "}
            <strong>{count}</strong>{" "}
            {count === 1 ? "solicitação" : "solicitações"} agrupadas.
          </p>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {loading ? "Finalizando..." : "Finalizar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
