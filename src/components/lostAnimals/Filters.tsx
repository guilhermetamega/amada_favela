import type { LostAnimalsFiltersState } from "@/types/lost_animals";

type Props = {
  value: LostAnimalsFiltersState;
  onChange: (next: LostAnimalsFiltersState) => void;
};

export default function LostAnimalsFilters({ value, onChange }: Props) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <input
          type="text"
          value={value.search}
          onChange={(event) =>
            onChange({
              ...value,
              search: event.target.value,
            })
          }
          placeholder="Buscar por nome ou descrição..."
          className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        />

        <select
          value={value.type}
          onChange={(event) =>
            onChange({
              ...value,
              type: event.target.value as LostAnimalsFiltersState["type"],
            })
          }
          className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        >
          <option value="all">Todos os tipos</option>
          <option value="lost">Perdidos</option>
          <option value="found">Achados</option>
        </select>

        <select
          value={value.status}
          onChange={(event) =>
            onChange({
              ...value,
              status: event.target.value as LostAnimalsFiltersState["status"],
            })
          }
          className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        >
          <option value="all">Todos os status</option>
          <option value="open">Em aberto</option>
          <option value="resolved">Resolvidos</option>
        </select>
      </div>
    </section>
  );
}
