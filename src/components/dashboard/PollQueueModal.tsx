import { useEffect, useState } from "react";
import type { Poll } from "@/types/polls";

type Props = {
  open: boolean;
  poll: Poll | null;
  queuePosition: number;
  queueTotal: number;
  onSelect: (pollId: string, optionId: string, optionLabel: string) => void;
  onClose: () => void;
};

export default function DashboardPollQueueModal({
  open,
  poll,
  queuePosition,
  queueTotal,
  onSelect,
  onClose,
}: Props) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !poll) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntered(false);

    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, poll?.id]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !poll) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-poll-title"
        className={`w-full max-w-lg rounded-[28px] border border-zinc-200 bg-white p-5 shadow-xl transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 ${
          entered ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-center gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Enquete pendente
            </p>

            <h2
              id="dashboard-poll-title"
              className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {poll.title}
            </h2>

            {poll.description ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {poll.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {poll.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(poll.id, option.id, option.label)}
              className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-left transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {option.label}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-col justify-center items-center">
          <div className="my-4 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Publicada em{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(poll.created_at))}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Fechar agora
            </button>
          </div>

          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {queuePosition}/{queueTotal}
          </span>
        </div>
      </div>
    </div>
  );
}
