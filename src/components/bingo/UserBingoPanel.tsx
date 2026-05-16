import { useEffect, useState } from "react";
import { CalendarClock, Eye, RotateCcw } from "lucide-react";
import BingoCardGrid from "@/components/bingo/CardGrid";
import type { BingoCard, BingoGame } from "@/types/bingo";

type Props = {
  bingo: BingoGame;
  card: BingoCard | null;
  associationLogoUrl: string | null;
  canAccessPremium: boolean;
  loadingCard: boolean;
  onCreateCard: () => void;
  onReroll: () => void;
  onToggleNumber: (number: number) => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function UserBingoPanel({
  bingo,
  card,
  associationLogoUrl,
  canAccessPremium,
  loadingCard,
  onCreateCard,
  onReroll,
  onToggleNumber,
}: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const started = new Date(bingo.scheduled_at).getTime() <= now.getTime();
  const canReroll = canAccessPremium && !!card && !card.rerolled_at;

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
          {bingo.title}
        </h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <CalendarClock className="h-4 w-4" />
          {formatDateTime(bingo.scheduled_at)}
        </p>

        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          {canAccessPremium
            ? started
              ? "Bingo iniciado: toque nos números sorteados para marcar sua cartela."
              : "Sua cartela ficará pronta para marcação quando chegar a data e hora."
            : "Usuários gratuitos podem observar o bingo, mas marcar a cartela é um recurso para pagantes."}
        </div>
      </div>

      {!card ? (
        <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gere sua cartela única com números de 1 até 75 sem repetição.
          </p>
          <button
            type="button"
            disabled={loadingCard}
            onClick={onCreateCard}
            className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Gerar cartela
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!canReroll || loadingCard}
              onClick={onReroll}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-5 w-5" />
              Roletar bingo
            </button>
            <div className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              <Eye className="h-5 w-5" />
              {card.rerolled_at ? "Roleta já utilizada" : "1 roleta disponível"}
            </div>
          </div>

          <BingoCardGrid
            card={card}
            associationLogoUrl={associationLogoUrl}
            canMark={canAccessPremium}
            canInteractNow={started}
            onToggleNumber={onToggleNumber}
          />
        </>
      )}
    </section>
  );
}
