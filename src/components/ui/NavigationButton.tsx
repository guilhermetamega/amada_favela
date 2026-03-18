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
      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 p-3 text-left shadow-lg transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 sm:min-h-37 sm:p-5 ${color.borderHover} ${color.hoverGlow}`}
    >
      {/* Top gradient bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${color.topBar}`}
      />

      <div className="flex h-full flex-col justify-between gap-2 sm:gap-4">
        {/* Top content */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
            {/* Icon */}
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition sm:h-11 sm:w-11 ${color.iconBox}`}
            >
              <Icon size={18} className="sm:h-5 sm:w-5" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <h2 className="wrap-anywhere text-sm font-semibold leading-5 text-white sm:line-clamp-2 sm:text-lg sm:leading-6">
                {label}
              </h2>

              <p className="mt-0.5 hidden line-clamp-2 text-sm leading-5 text-zinc-300/80 sm:block">
                {description || "Abrir funcionalidade."}
              </p>
            </div>
          </div>

          {/* Arrow (hidden on mobile) */}
          <div
            className={`mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center text-base text-zinc-500 transition sm:flex ${color.arrow}`}
          >
            →
          </div>
        </div>

        {/* Bottom helper text (desktop only) */}
        <div className="hidden items-center justify-between sm:flex">
          <span className="text-xs text-zinc-500 transition group-hover:text-zinc-300">
            Toque para abrir
          </span>
        </div>
      </div>
    </button>
  );
}
