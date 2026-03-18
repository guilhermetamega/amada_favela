export type RouteThemeColor =
  | "emerald"
  | "amber"
  | "sky"
  | "rose"
  | "violet"
  | "cyan"
  | "orange";

type DashboardThemeClasses = {
  topBar: string;
  iconBox: string;
  badge: string;
  hoverGlow: string;
  borderHover: string;
  arrow: string;
};

type SidebarThemeClasses = {
  icon: string;
  active: string;
  hover: string;
  accent: string;
};

export function getDashboardRouteTheme(
  colorClass: RouteThemeColor,
): DashboardThemeClasses {
  switch (colorClass) {
    case "emerald":
      return {
        topBar:
          "from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-600",
        iconBox:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 group-hover:bg-emerald-500/15 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20",
        badge:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        hoverGlow: "hover:shadow-emerald-500/10",
        borderHover:
          "hover:border-emerald-500/30 dark:hover:border-emerald-500/40",
        arrow: "group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
      };

    case "amber":
      return {
        topBar:
          "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-500",
        iconBox:
          "border-amber-500/25 bg-amber-500/10 text-amber-700 group-hover:bg-amber-500/15 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:group-hover:bg-amber-500/20",
        badge:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        hoverGlow: "hover:shadow-amber-500/10",
        borderHover: "hover:border-amber-500/30 dark:hover:border-amber-500/40",
        arrow: "group-hover:text-amber-700 dark:group-hover:text-amber-300",
      };

    case "sky":
      return {
        topBar: "from-sky-500 to-blue-500 dark:from-sky-400 dark:to-blue-500",
        iconBox:
          "border-sky-500/25 bg-sky-500/10 text-sky-700 group-hover:bg-sky-500/15 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:group-hover:bg-sky-500/20",
        badge:
          "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
        hoverGlow: "hover:shadow-sky-500/10",
        borderHover: "hover:border-sky-500/30 dark:hover:border-sky-500/40",
        arrow: "group-hover:text-sky-700 dark:group-hover:text-sky-300",
      };

    case "rose":
      return {
        topBar: "from-rose-500 to-pink-500 dark:from-rose-400 dark:to-pink-500",
        iconBox:
          "border-rose-500/25 bg-rose-500/10 text-rose-700 group-hover:bg-rose-500/15 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:group-hover:bg-rose-500/20",
        badge:
          "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
        hoverGlow: "hover:shadow-rose-500/10",
        borderHover: "hover:border-rose-500/30 dark:hover:border-rose-500/40",
        arrow: "group-hover:text-rose-700 dark:group-hover:text-rose-300",
      };

    case "violet":
      return {
        topBar:
          "from-violet-500 to-purple-500 dark:from-violet-400 dark:to-purple-500",
        iconBox:
          "border-violet-500/25 bg-violet-500/10 text-violet-700 group-hover:bg-violet-500/15 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300 dark:group-hover:bg-violet-500/20",
        badge:
          "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
        hoverGlow: "hover:shadow-violet-500/10",
        borderHover:
          "hover:border-violet-500/30 dark:hover:border-violet-500/40",
        arrow: "group-hover:text-violet-700 dark:group-hover:text-violet-300",
      };

    case "cyan":
      return {
        topBar: "from-cyan-500 to-teal-500 dark:from-cyan-400 dark:to-teal-500",
        iconBox:
          "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 group-hover:bg-cyan-500/15 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300 dark:group-hover:bg-cyan-500/20",
        badge:
          "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300",
        hoverGlow: "hover:shadow-cyan-500/10",
        borderHover: "hover:border-cyan-500/30 dark:hover:border-cyan-500/40",
        arrow: "group-hover:text-cyan-700 dark:group-hover:text-cyan-300",
      };

    case "orange":
      return {
        topBar:
          "from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-600",
        iconBox:
          "border-orange-500/25 bg-orange-500/10 text-orange-700 group-hover:bg-orange-500/15 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300 dark:group-hover:bg-orange-500/20",
        badge:
          "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
        hoverGlow: "hover:shadow-orange-500/10",
        borderHover:
          "hover:border-orange-500/30 dark:hover:border-orange-500/40",
        arrow: "group-hover:text-orange-700 dark:group-hover:text-orange-300",
      };

    default:
      return {
        topBar:
          "from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-600",
        iconBox:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 group-hover:bg-emerald-500/15 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20",
        badge:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        hoverGlow: "hover:shadow-emerald-500/10",
        borderHover:
          "hover:border-emerald-500/30 dark:hover:border-emerald-500/40",
        arrow: "group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
      };
  }
}

export function getSidebarRouteTheme(
  colorClass: RouteThemeColor,
  isActive: boolean,
): SidebarThemeClasses {
  switch (colorClass) {
    case "emerald":
      return {
        icon: isActive
          ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-300"
          : "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        active:
          "border-emerald-500/25 bg-emerald-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(16,185,129,0.10)] dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-emerald-500/25 hover:bg-emerald-500/8 dark:hover:border-emerald-500/25 dark:hover:bg-emerald-500/8 ",
        accent: "bg-emerald-500 dark:bg-emerald-400 ",
      };

    case "amber":
      return {
        icon: isActive
          ? "border-amber-500/30 bg-amber-500/12 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-300"
          : "border-amber-500/20 bg-amber-500/8 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
        active:
          "border-amber-500/25 bg-amber-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(245,158,11,0.10)] dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(245,158,11,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-amber-500/25 hover:bg-amber-500/8 dark:hover:border-amber-500/25 dark:hover:bg-amber-500/8",
        accent: "bg-amber-500 dark:bg-amber-400",
      };

    case "sky":
      return {
        icon: isActive
          ? "border-sky-500/30 bg-sky-500/12 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/20 dark:text-sky-300"
          : "border-sky-500/20 bg-sky-500/8 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
        active:
          "border-sky-500/25 bg-sky-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(14,165,233,0.10)] dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(14,165,233,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-sky-500/25 hover:bg-sky-500/8 dark:hover:border-sky-500/25 dark:hover:bg-sky-500/8",
        accent: "bg-sky-500 dark:bg-sky-400",
      };

    case "rose":
      return {
        icon: isActive
          ? "border-rose-500/30 bg-rose-500/12 text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/20 dark:text-rose-300"
          : "border-rose-500/20 bg-rose-500/8 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
        active:
          "border-rose-500/25 bg-rose-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(244,63,94,0.10)] dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(244,63,94,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-rose-500/25 hover:bg-rose-500/8 dark:hover:border-rose-500/25 dark:hover:bg-rose-500/8",
        accent: "bg-rose-500 dark:bg-rose-400",
      };

    case "violet":
      return {
        icon: isActive
          ? "border-violet-500/30 bg-violet-500/12 text-violet-700 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-300"
          : "border-violet-500/20 bg-violet-500/8 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
        active:
          "border-violet-500/25 bg-violet-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(139,92,246,0.10)] dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(139,92,246,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-violet-500/25 hover:bg-violet-500/8 dark:hover:border-violet-500/25 dark:hover:bg-violet-500/8",
        accent: "bg-violet-500 dark:bg-violet-400",
      };

    case "cyan":
      return {
        icon: isActive
          ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-300"
          : "border-cyan-500/20 bg-cyan-500/8 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300",
        active:
          "border-cyan-500/25 bg-cyan-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(34,211,238,0.10)] dark:border-cyan-500/30 dark:bg-cyan-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(34,211,238,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-cyan-500/25 hover:bg-cyan-500/8 dark:hover:border-cyan-500/25 dark:hover:bg-cyan-500/8",
        accent: "bg-cyan-500 dark:bg-cyan-400",
      };

    case "orange":
      return {
        icon: isActive
          ? "border-orange-500/30 bg-orange-500/12 text-orange-700 dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-300"
          : "border-orange-500/20 bg-orange-500/8 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
        active:
          "border-orange-500/25 bg-orange-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(249,115,22,0.10)] dark:border-orange-500/30 dark:bg-orange-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(249,115,22,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-orange-500/25 hover:bg-orange-500/8 dark:hover:border-orange-500/25 dark:hover:bg-orange-500/8",
        accent: "bg-orange-500 dark:bg-orange-400",
      };

    default:
      return {
        icon: isActive
          ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-300"
          : "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        active:
          "border-emerald-500/25 bg-emerald-500/10 text-zinc-900 shadow-[0_0_0_1px_rgba(16,185,129,0.10)] dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.12)]",
        hover:
          "hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-emerald-500/25 hover:bg-emerald-500/8 dark:hover:border-emerald-500/25 dark:hover:bg-emerald-500/8",
        accent: "bg-emerald-500 dark:bg-emerald-400",
      };
  }
}
