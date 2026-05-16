import { CalendarClock, Dices } from "lucide-react";
import BingoNumberTrail from "@/components/bingo/NumberTrail";
import type { BingoGame } from "@/types/bingo";

type Props = {
  bingo: BingoGame | null;
  rollingNumber: number | null;
  drawing: boolean;
  onDraw: () => void;
};

function formatDateTime(value?: string) {
  if (!value) return "Sem data definida";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BingoAdminDrawPanel({
  bingo,
  rollingNumber,
  drawing,
  onDraw,
}: Props) {
  if (!bingo) {
    return (
      <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        Crie ou selecione um bingo para iniciar os sorteios.
      </div>
    );
  }

  const displayNumber = rollingNumber ?? bingo.current_number;

  return (
    <section className="space-y-4">
      <BingoNumberTrail numbers={bingo.drawn_numbers} />

      <div className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 bg-zinc-50 p-4 text-left dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-5">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            {bingo.title}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <CalendarClock className="h-4 w-4" />
            {formatDateTime(bingo.scheduled_at)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-5 p-5 sm:p-8">
          <div className="relative flex aspect-square w-48 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 p-3 shadow-2xl shadow-amber-500/20 sm:w-64">
            <div className="absolute inset-5 rounded-full border border-white/50" />
            <div
              className={`flex h-full w-full items-center justify-center rounded-full bg-white text-7xl font-black text-zinc-950 shadow-inner dark:bg-zinc-950 dark:text-amber-200 sm:text-8xl ${
                drawing ? "animate-bounce" : ""
              }`}
            >
              {displayNumber ? String(displayNumber).padStart(2, "0") : "--"}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {drawing
                ? "A bolinha está rolando..."
                : `${bingo.numbers_remaining} números restantes`}
            </p>
          </div>

          <button
            type="button"
            disabled={!bingo.can_draw || drawing}
            onClick={onDraw}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Dices className="h-5 w-5" />
            Sortear número
          </button>
        </div>
      </div>
    </section>
  );
}
