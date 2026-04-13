import { useEffect, useMemo, useState } from "react";
import type { Poll } from "@/types/polls";

type Props = {
  items: Poll[];
  onOpen: (poll: Poll) => void;
};

export default function DashboardPollCarousel({ items, onOpen }: Props) {
  const [index, setIndex] = useState(0);

  const safeItems = useMemo(
    () => items.filter((poll) => poll?.title?.trim()),
    [items],
  );

  useEffect(() => {
    if (safeItems.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(0);
      return;
    }

    if (index > safeItems.length - 1) {
      setIndex(0);
    }
  }, [index, safeItems.length]);

  useEffect(() => {
    if (safeItems.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeItems.length);
    }, 48000);

    return () => window.clearInterval(timer);
  }, [safeItems.length]);

  if (!safeItems.length) return null;

  const current = safeItems[index];
  const isLocked = current.has_voted || !current.voting_open;

  const topOptions = [...current.options]
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
    .slice(0, 3);

  function getStatusLabel() {
    if (current.has_voted) return "Votado";
    if (!current.voting_open) return "Encerrada";
    return "Votar";
  }

  function getFooterLabel() {
    if (current.has_voted) return "Resultado disponível";
    if (!current.voting_open) return "Votação encerrada";
    return "Toque para votar";
  }

  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => {
          if (!isLocked) onOpen(current);
        }}
        disabled={isLocked}
        className={`w-full px-5 py-5 text-left transition sm:px-6 sm:py-6 ${
          isLocked
            ? "cursor-default"
            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Enquete
            </p>

            <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
              {current.title}
            </h3>

            {current.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {current.description}
              </p>
            ) : null}
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              current.has_voted
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : !current.voting_open
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {getStatusLabel()}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {topOptions.map((option) => {
            const percentage = option.percentage ?? 0;

            return (
              <div key={option.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                    {option.label}
                  </span>

                  <div className="flex items-center gap-2">
                    {current.user_vote_option_id === option.id ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        Seu voto
                      </span>
                    ) : null}

                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {current.total_votes} {current.total_votes === 1 ? "voto" : "votos"}
          </span>
          <span>{getFooterLabel()}</span>
        </div>
      </button>

      {safeItems.length > 1 ? (
        <div className="flex justify-center gap-2 px-4 pb-3">
          {safeItems.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className={`h-2.5 rounded-full transition ${
                itemIndex === index
                  ? "w-7 bg-zinc-900 dark:bg-white"
                  : "w-2.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500"
              }`}
              aria-label={`Ir para enquete ${itemIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
