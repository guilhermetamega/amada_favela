import type { Poll } from "@/types/polls";
import PollResults from "@/components/polls/PollResults";

type Props = {
  poll: Poll;
  onVote: (pollId: string, optionId: string, optionLabel: string) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PollCard({ poll, onVote }: Props) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
            {poll.voting_open ? "Votação aberta" : "Encerrada"}
          </span>
          {poll.has_voted ? (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Você já votou
            </span>
          ) : null}
        </div>

        <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {poll.title}
        </h2>

        {poll.description ? (
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {poll.description}
          </p>
        ) : null}

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Votação até {formatDate(poll.voting_ends_at)} · Exibição até{" "}
          {formatDate(poll.visible_until)}
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <PollResults poll={poll} />

        {!poll.has_voted && poll.voting_open ? (
          <div className="grid grid-cols-1 gap-3">
            {poll.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onVote(poll.id, option.id, option.label)}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-800 transition hover:border-violet-500 hover:bg-violet-500/5 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
