type Props = {
  onCreate: () => void;
};

export default function LostAndFoundEmptyState({ onCreate }: Props) {
  return (
    <section className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
        Nenhum item encontrado
      </h2>

      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Ajuste os filtros ou publique um novo item para começar.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:opacity-90 dark:border-zinc-800 dark:bg-white dark:text-zinc-900"
      >
        Criar novo item
      </button>
    </section>
  );
}
