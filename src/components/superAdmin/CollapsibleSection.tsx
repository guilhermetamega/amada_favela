import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
};

export default function CollapsibleSection({
  id,
  title,
  description,
  icon,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-300">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-zinc-400 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? <div className="p-5">{children}</div> : null}
    </section>
  );
}
