import { Pencil, Plus, Trash2 } from "lucide-react";
import SectionCard from "@/components/resumeBuilder/SectionCard";
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
      <div className="space-y-3">
        {items.map((item, idx) => (
          <article
            key={item.id}
            className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">Item {idx + 1}</p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid gap-2">
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                value={item.institution}
                onChange={(e) =>
                  updateItem(item.id, { institution: e.target.value })
                }
                placeholder="Empresa/Instituição"
              />
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                value={item.role}
                onChange={(e) => updateItem(item.id, { role: e.target.value })}
                placeholder="Cargo/Curso"
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select
                  className="rounded-xl border border-zinc-200 px-2 py-2 text-sm dark:border-zinc-700"
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
                  className="rounded-xl border border-zinc-200 px-2 py-2 text-sm dark:border-zinc-700"
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
                  className="rounded-xl border border-zinc-200 px-2 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
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
                  className="rounded-xl border border-zinc-200 px-2 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
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
              <label className="text-xs">
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
                  className="mr-2"
                />
                Atual
              </label>
              <textarea
                className="min-h-20 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
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
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
        >
          <Plus size={14} />
          Adicionar item ({items.length}/{limit})
        </button>
      </div>
    </SectionCard>
  );
}
