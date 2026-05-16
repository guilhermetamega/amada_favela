import type { BingoCard } from "@/types/bingo";

type Props = {
  card: BingoCard | null;
  associationLogoUrl: string | null;
  canMark: boolean;
  canInteractNow: boolean;
  onToggleNumber: (number: number) => void;
};

const CENTER_INDEX = 12;

export default function BingoCardGrid({
  card,
  associationLogoUrl,
  canMark,
  canInteractNow,
  onToggleNumber,
}: Props) {
  const numbers = card?.numbers ?? [];
  const markedNumbers = new Set(card?.marked_numbers ?? []);
  const disabled = !canMark || !canInteractNow;

  return (
    <div className="grid grid-cols-5 gap-2 rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:gap-3 sm:p-4">
      {Array.from({ length: 25 }).map((_, index) => {
        if (index === CENTER_INDEX) {
          return (
            <div
              key="logo"
              className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 p-2 dark:bg-zinc-800"
            >
              {associationLogoUrl ? (
                <img
                  src={associationLogoUrl}
                  alt="Logo da associação"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">
                  AMA
                </span>
              )}
            </div>
          );
        }

        const number = numbers[index];
        const marked = typeof number === "number" && markedNumbers.has(number);

        return (
          <button
            key={index}
            type="button"
            disabled={disabled || typeof number !== "number"}
            onClick={() => typeof number === "number" && onToggleNumber(number)}
            className={`flex aspect-square items-center justify-center rounded-2xl text-lg font-black transition sm:text-2xl ${
              marked
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
            } ${disabled ? "cursor-default" : "hover:scale-[1.03] active:scale-95"}`}
          >
            {typeof number === "number" ? number : "--"}
          </button>
        );
      })}
    </div>
  );
}
