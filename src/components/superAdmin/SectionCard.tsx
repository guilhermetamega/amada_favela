import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  action?: ReactNode;
};

export default function SectionCard({
  title,
  description,
  icon,
  isExpanded,
  onToggle,
  children,
  action,
}: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={onToggle}
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
        <span className="text-xs text-zinc-400">{isExpanded ? "Recolher" : "Expandir"}</span>
      </button>
      {isExpanded ? <div className="p-5">{action}{children}</div> : null}
    </section>
  );
}
