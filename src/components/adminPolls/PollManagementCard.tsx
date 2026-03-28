import type { Poll } from "@/types/polls";
import PollResults from "@/components/polls/PollResults";

type Props = {
  poll: Poll;
  onEdit: (poll: Poll) => void;
};

export default function PollManagementCard({ poll, onEdit }: Props) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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
            onClick={() => onEdit(poll)}
            className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Editar
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <PollResults poll={poll} />

        <div className="grid grid-cols-1 gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-3">
          <div>Votos: {poll.total_votes}</div>
          <div>{poll.voting_open ? "Votação aberta" : "Votação encerrada"}</div>
          <div>{poll.status === "active" ? "Ativa" : "Arquivada"}</div>
        </div>
      </div>
    </article>
  );
}
