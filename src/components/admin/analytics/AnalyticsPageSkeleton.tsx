export default function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-32 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />

      <div className="h-56 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({
          length: 8,
        }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-96 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
