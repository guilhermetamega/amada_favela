type Props = {
  communityName: string;
  total: number;
};

export default function HomeRentHero({ total }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="bg-linear-to-r from-sky-500/10 via-fuchsia-500/10 to-emerald-500/10 px-5 py-5 dark:from-sky-500/15 dark:via-fuchsia-500/10 dark:to-emerald-500/10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
              Imóveis da sua comunidade
            </h2>

            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Visualize imóveis publicados apenas para a sua região.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Anúncios disponíveis
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
              {total}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
