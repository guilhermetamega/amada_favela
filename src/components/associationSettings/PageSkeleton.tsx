export default function AssociationPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={`animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800 ${
                index === 0 ? "h-24 md:col-span-2" : "h-14"
              }`}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-80 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      </section>
    </div>
  );
}
