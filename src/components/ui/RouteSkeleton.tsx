export default function RouteSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-12 w-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />

        <div className="h-40 w-full animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="h-72 w-full animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
