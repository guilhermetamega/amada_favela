import type { Poll } from "@/types/polls";

type Props = {
  open: boolean;
  poll: Poll | null;
  onClose: () => void;
  onVote: (pollId: string, optionId: string, label: string) => void;
};

export default function DashboardPollModal({
  open,
  poll,
  onClose,
  onVote,
}: Props) {
  if (!open || !poll) return null;

  const canVote = poll.voting_open && !poll.has_voted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-[28px] border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Enquete
            </p>

            <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {poll.title}
            </h2>

            {poll.description ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {poll.description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {poll.options.map((option) => {
            const percentage = option.percentage ?? 0;
            const isUserVote = poll.user_vote_option_id === option.id;

            if (canVote) {
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onVote(poll.id, option.id, option.label);
                    onClose();
                  }}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-left transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {option.label}
                    </span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {percentage}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            }

            return (
              <div
                key={option.id}
                className={`w-full rounded-2xl border px-4 py-3 ${
                  isUserVote
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {option.label}
                    </span>

                    {isUserVote ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Seu voto
                      </span>
                    ) : null}
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {percentage}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isUserVote
                        ? "bg-emerald-500"
                        : "bg-zinc-900 dark:bg-zinc-100"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {poll.total_votes}{" "}
            {poll.total_votes === 1 ? "voto registrado" : "votos registrados"}
          </span>
          <span>
            {poll.has_voted
              ? "Você já votou"
              : poll.voting_open
                ? "Escolha uma opção"
                : "Votação encerrada"}
          </span>
        </div>
      </div>
    </div>
  );
}
