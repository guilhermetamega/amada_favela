import { Pencil, Plus, Trash2 } from "lucide-react";
import SectionCard from "@/components/resumeBuilder/Section";
import type { ResumeTimelineItem } from "@/types/resume_builder";

const months = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];
const years = Array.from(
  { length: 50 },
  (_, i) => `${new Date().getFullYear() - i}`,
);

export default function TimelineListSection({
  title,
  items,
  limit,
  onChange,
  canEdit = true,
}: {
  title: string;
  items: ResumeTimelineItem[];
  limit: number;
  onChange: (items: ResumeTimelineItem[]) => void;
  canEdit?: boolean;
}) {
  const inputClass =
    "w-full rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500";
  const selectClass =
    "w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 dark:focus:border-emerald-500";

  function addItem() {
    if (items.length >= limit) return;
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        institution: "",
        role: "",
        startMonth: "",
        startYear: "",
        endMonth: "",
        endYear: "",
        isCurrent: false,
        activities: "",
      },
    ]);
  }
  function updateItem(id: string, patch: Partial<ResumeTimelineItem>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <SectionCard title={title}>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <article
            key={item.id}
            className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                Item {idx + 1}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition hover:bg-red-500/10"
                aria-label={`Remover item ${idx + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid gap-3">
              <input
                className={inputClass}
                value={item.institution}
                onChange={(e) =>
                  updateItem(item.id, { institution: e.target.value })
                }
                placeholder="Empresa/Instituição"
              />
              <input
                className={inputClass}
                value={item.role}
                onChange={(e) => updateItem(item.id, { role: e.target.value })}
                placeholder="Cargo/Curso"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  className={selectClass}
                  value={item.startMonth}
                  onChange={(e) =>
                    updateItem(item.id, { startMonth: e.target.value })
                  }
                >
                  <option value="">Mês início</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClass}
                  value={item.startYear}
                  onChange={(e) =>
                    updateItem(item.id, { startYear: e.target.value })
                  }
                >
                  <option value="">Ano início</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  disabled={item.isCurrent}
                  className={selectClass}
                  value={item.endMonth}
                  onChange={(e) =>
                    updateItem(item.id, { endMonth: e.target.value })
                  }
                >
                  <option value="">Mês saída</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  disabled={item.isCurrent}
                  className={selectClass}
                  value={item.endYear}
                  onChange={(e) =>
                    updateItem(item.id, { endYear: e.target.value })
                  }
                >
                  <option value="">Ano saída</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={item.isCurrent}
                  onChange={(e) =>
                    updateItem(item.id, {
                      isCurrent: e.target.checked,
                      endMonth: e.target.checked ? "" : item.endMonth,
                      endYear: e.target.checked ? "" : item.endYear,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-900"
                />
                Atual
              </label>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={item.activities}
                onChange={(e) =>
                  updateItem(item.id, { activities: e.target.value })
                }
                placeholder={canEdit ? "Atividades" : "Descrição"}
              />
              {!canEdit ? (
                <div className="text-xs text-zinc-500 inline-flex items-center gap-1">
                  <Pencil size={12} />
                  Sem edição após criar.
                </div>
              ) : null}
            </div>
          </article>
        ))}
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= limit}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus size={14} />
          Adicionar item ({items.length}/{limit})
        </button>
      </div>
    </SectionCard>
  );
}
