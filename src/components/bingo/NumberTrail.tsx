type Props = {
  numbers: number[];
};

export default function BingoNumberTrail({ numbers }: Props) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between gap-3 text-left">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Números sorteados
        </h2>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {numbers.length}/75
        </span>
      </div>

      {numbers.length === 0 ? (
        <p className="text-left text-sm text-zinc-500 dark:text-zinc-400">
          Nenhuma bolinha foi sorteada ainda.
        </p>
      ) : (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {numbers.map((number, index) => (
            <span
              key={`${number}-${index}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-zinc-950 shadow-inner ring-4 ring-amber-200 dark:bg-amber-300 dark:ring-amber-900/40"
            >
              {number}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
