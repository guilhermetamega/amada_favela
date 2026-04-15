import type { NavigationButtonTheme } from "@/components/ui/NavigationButton";

export const sponsorNavigationTheme: NavigationButtonTheme = {
  borderHover: "hover:border-emerald-300/80 dark:hover:border-emerald-700/80",
  hoverGlow: "hover:shadow-emerald-500/10 dark:hover:shadow-emerald-900/20",
  topBar:
    "from-emerald-500 via-emerald-400 to-teal-400 dark:from-emerald-600 dark:via-emerald-500 dark:to-teal-500",
  iconBox:
    "border-emerald-200 bg-emerald-50 text-emerald-700 group-hover:border-emerald-300 group-hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:group-hover:border-emerald-800 dark:group-hover:bg-emerald-900/50",
  arrow:
    "group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
};
