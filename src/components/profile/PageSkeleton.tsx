export default function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-4xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="h-40 w-40 animate-pulse rounded-4xl bg-zinc-200 dark:bg-zinc-800 sm:h-48 sm:w-48" />
            <div className="space-y-3">
              <div className="h-8 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </section>

      <section className="h-96 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
