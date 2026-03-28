import type { Poll } from "@/types/polls";

type Props = {
  poll: Poll;
};

export default function PollResults({ poll }: Props) {
  return (
    <div className="space-y-3">
      {poll.options.map((option) => (
        <div key={option.id}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {option.label}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {option.votes_count ?? 0} votos · {option.percentage ?? 0}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${option.percentage ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
