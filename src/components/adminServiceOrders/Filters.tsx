type Props = {
  search: string;
  selectedDate: string;
  selectedTopic: string;
  topics: string[];
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onClear: () => void;
};

export default function AdminServiceOrdersFilters({
  search,
  selectedDate,
  selectedTopic,
  topics,
  onSearchChange,
  onDateChange,
  onTopicChange,
  onClear,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Filtros
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Refine as ocorrências por texto, data e tipo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] sm:p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Buscar
          </label>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rua, descrição ou tópico"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Data
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tópico
          </label>
          <select
            value={selectedTopic}
            onChange={(event) => onTopicChange(event.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
          >
            <option value="">Todos</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onClear}
            className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </section>
  );
}
