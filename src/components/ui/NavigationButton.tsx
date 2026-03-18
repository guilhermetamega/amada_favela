import type { LucideIcon } from "lucide-react";

type NavigationButtonTheme = {
  borderHover: string;
  hoverGlow: string;
  topBar: string;
  iconBox: string;
  arrow: string;
};

type NavigationButtonProps = {
  label: string;
  description?: string;
  onClick: () => void;
  icon: LucideIcon;
  color: NavigationButtonTheme;
};

export default function NavigationButton({
  label,
  description,
  onClick,
  icon: Icon,
  color,
}: NavigationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 text-left shadow-lg transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 sm:min-h-[148px] sm:p-5 ${color.borderHover} ${color.hoverGlow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color.topBar}`}
      />

      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${color.iconBox}`}
            >
              <Icon size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white sm:text-lg">
                {label}
              </h2>

              <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-300/80">
                {description || "Abrir funcionalidade."}
              </p>
            </div>
          </div>

          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500 transition ${color.arrow}`}
          >
            →
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 transition group-hover:text-zinc-300">
            Toque para abrir
          </span>
        </div>
      </div>
    </button>
  );
}
