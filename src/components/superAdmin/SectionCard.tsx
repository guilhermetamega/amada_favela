import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type SectionCardProps = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
  headerAction?: ReactNode;
};

export default function SectionCard({
  id,
  title,
  description,
  icon,
  isOpen,
  onToggle,
  children,
  headerAction,
}: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 md:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => onToggle(id)}
            aria-expanded={isOpen}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {icon}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white md:text-lg">
                {title}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>
            <ChevronDown
              size={18}
              className={`text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isOpen ? headerAction : null}
        </div>
      </div>

      {isOpen ? <div className="p-4 md:p-5">{children}</div> : null}
    </section>
  );
}
