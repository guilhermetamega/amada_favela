import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import SectionCard from "@/components/resumeBuilder/Section";
import type { ResumeSkillItem } from "@/types/resume_builder";

export default function SkillsSection({
  items,
  onChange,
}: {
  items: ResumeSkillItem[];
  onChange: (items: ResumeSkillItem[]) => void;
}) {
  const [value, setValue] = useState("");
  function addSkill() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onChange([...items, { id: crypto.randomUUID(), name: trimmed }]);
    setValue("");
  }

  return (
    <SectionCard title="Competências">
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
          placeholder="Adicionar competência"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-xl border px-3"
          onClick={addSkill}
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
          >
            <span>{item.name}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((x) => x.id !== item.id))}
              className="text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
