export default function BingoPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-36 animate-pulse rounded-[28px] bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-80 animate-pulse rounded-[28px] bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
