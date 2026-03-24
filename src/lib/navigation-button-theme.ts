import type { NavigationButtonTheme } from "@/components/ui/NavigationButton";

type RouteColor =
  | "emerald"
  | "amber"
  | "sky"
  | "rose"
  | "violet"
  | "cyan"
  | "orange";

const themes: Record<RouteColor, NavigationButtonTheme> = {
  emerald: {
    borderHover: "hover:border-emerald-300 dark:hover:border-emerald-700",
    hoverGlow: "hover:shadow-emerald-500/10",
    topBar: "from-emerald-400 via-emerald-500 to-teal-500",
    iconBox:
      "border-emerald-200 bg-emerald-50 text-emerald-600 group-hover:border-emerald-300 group-hover:bg-emerald-100 dark:border-emerald-900/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:group-hover:border-emerald-800 dark:group-hover:bg-emerald-900/60",
    arrow: "group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
  },
  amber: {
    borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
    hoverGlow: "hover:shadow-amber-500/10",
    topBar: "from-amber-300 via-yellow-400 to-orange-400",
    iconBox:
      "border-amber-200 bg-amber-50 text-amber-600 group-hover:border-amber-300 group-hover:bg-amber-100 dark:border-amber-900/80 dark:bg-amber-950/60 dark:text-amber-300 dark:group-hover:border-amber-800 dark:group-hover:bg-amber-900/60",
    arrow: "group-hover:text-amber-600 dark:group-hover:text-amber-300",
  },
  sky: {
    borderHover: "hover:border-sky-300 dark:hover:border-sky-700",
    hoverGlow: "hover:shadow-sky-500/10",
    topBar: "from-sky-300 via-sky-400 to-blue-500",
    iconBox:
      "border-sky-200 bg-sky-50 text-sky-600 group-hover:border-sky-300 group-hover:bg-sky-100 dark:border-sky-900/80 dark:bg-sky-950/60 dark:text-sky-300 dark:group-hover:border-sky-800 dark:group-hover:bg-sky-900/60",
    arrow: "group-hover:text-sky-600 dark:group-hover:text-sky-300",
  },
  rose: {
    borderHover: "hover:border-rose-300 dark:hover:border-rose-700",
    hoverGlow: "hover:shadow-rose-500/10",
    topBar: "from-rose-300 via-pink-400 to-rose-500",
    iconBox:
      "border-rose-200 bg-rose-50 text-rose-600 group-hover:border-rose-300 group-hover:bg-rose-100 dark:border-rose-900/80 dark:bg-rose-950/60 dark:text-rose-300 dark:group-hover:border-rose-800 dark:group-hover:bg-rose-900/60",
    arrow: "group-hover:text-rose-600 dark:group-hover:text-rose-300",
  },
  violet: {
    borderHover: "hover:border-violet-300 dark:hover:border-violet-700",
    hoverGlow: "hover:shadow-violet-500/10",
    topBar: "from-violet-300 via-violet-400 to-fuchsia-500",
    iconBox:
      "border-violet-200 bg-violet-50 text-violet-600 group-hover:border-violet-300 group-hover:bg-violet-100 dark:border-violet-900/80 dark:bg-violet-950/60 dark:text-violet-300 dark:group-hover:border-violet-800 dark:group-hover:bg-violet-900/60",
    arrow: "group-hover:text-violet-600 dark:group-hover:text-violet-300",
  },
  cyan: {
    borderHover: "hover:border-cyan-300 dark:hover:border-cyan-700",
    hoverGlow: "hover:shadow-cyan-500/10",
    topBar: "from-cyan-300 via-cyan-400 to-teal-500",
    iconBox:
      "border-cyan-200 bg-cyan-50 text-cyan-600 group-hover:border-cyan-300 group-hover:bg-cyan-100 dark:border-cyan-900/80 dark:bg-cyan-950/60 dark:text-cyan-300 dark:group-hover:border-cyan-800 dark:group-hover:bg-cyan-900/60",
    arrow: "group-hover:text-cyan-600 dark:group-hover:text-cyan-300",
  },
  orange: {
    borderHover: "hover:border-orange-300 dark:hover:border-orange-700",
    hoverGlow: "hover:shadow-orange-500/10",
    topBar: "from-orange-300 via-orange-400 to-red-500",
    iconBox:
      "border-orange-200 bg-orange-50 text-orange-600 group-hover:border-orange-300 group-hover:bg-orange-100 dark:border-orange-900/80 dark:bg-orange-950/60 dark:text-orange-300 dark:group-hover:border-orange-800 dark:group-hover:bg-orange-900/60",
    arrow: "group-hover:text-orange-600 dark:group-hover:text-orange-300",
  },
};

export function getNavigationButtonTheme(
  color: RouteColor,
): NavigationButtonTheme {
  return themes[color] ?? themes.emerald;
}
