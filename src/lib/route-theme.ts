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
        topBar: "from-emerald-400 to-emerald-600",
        iconBox:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 group-hover:bg-emerald-500/20",
        badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        hoverGlow: "hover:shadow-emerald-500/10",
        borderHover: "hover:border-emerald-500/40",
        arrow: "group-hover:text-emerald-300",
      };

    case "amber":
      return {
        topBar: "from-amber-400 to-orange-500",
        iconBox:
          "border-amber-500/30 bg-amber-500/15 text-amber-300 group-hover:bg-amber-500/20",
        badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        hoverGlow: "hover:shadow-amber-500/10",
        borderHover: "hover:border-amber-500/40",
        arrow: "group-hover:text-amber-300",
      };

    case "sky":
      return {
        topBar: "from-sky-400 to-blue-500",
        iconBox:
          "border-sky-500/30 bg-sky-500/15 text-sky-300 group-hover:bg-sky-500/20",
        badge: "border-sky-500/30 bg-sky-500/10 text-sky-300",
        hoverGlow: "hover:shadow-sky-500/10",
        borderHover: "hover:border-sky-500/40",
        arrow: "group-hover:text-sky-300",
      };

    case "rose":
      return {
        topBar: "from-rose-400 to-pink-500",
        iconBox:
          "border-rose-500/30 bg-rose-500/15 text-rose-300 group-hover:bg-rose-500/20",
        badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        hoverGlow: "hover:shadow-rose-500/10",
        borderHover: "hover:border-rose-500/40",
        arrow: "group-hover:text-rose-300",
      };

    case "violet":
      return {
        topBar: "from-violet-400 to-purple-500",
        iconBox:
          "border-violet-500/30 bg-violet-500/15 text-violet-300 group-hover:bg-violet-500/20",
        badge: "border-violet-500/30 bg-violet-500/10 text-violet-300",
        hoverGlow: "hover:shadow-violet-500/10",
        borderHover: "hover:border-violet-500/40",
        arrow: "group-hover:text-violet-300",
      };

    case "cyan":
      return {
        topBar: "from-cyan-400 to-teal-500",
        iconBox:
          "border-cyan-500/30 bg-cyan-500/15 text-cyan-300 group-hover:bg-cyan-500/20",
        badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        hoverGlow: "hover:shadow-cyan-500/10",
        borderHover: "hover:border-cyan-500/40",
        arrow: "group-hover:text-cyan-300",
      };

    case "orange":
      return {
        topBar: "from-orange-400 to-orange-600",
        iconBox:
          "border-orange-500/30 bg-orange-500/15 text-orange-300 group-hover:bg-orange-500/20",
        badge: "border-orange-500/30 bg-orange-500/10 text-orange-300",
        hoverGlow: "hover:shadow-orange-500/10",
        borderHover: "hover:border-orange-500/40",
        arrow: "group-hover:text-orange-300",
      };

    default:
      return {
        topBar: "from-emerald-400 to-emerald-600",
        iconBox:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 group-hover:bg-emerald-500/20",
        badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        hoverGlow: "hover:shadow-emerald-500/10",
        borderHover: "hover:border-emerald-500/40",
        arrow: "group-hover:text-emerald-300",
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
          ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        active:
          "border-emerald-500/30 bg-emerald-500/12 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.12)]",
        hover: "hover:border-emerald-500/25 hover:bg-emerald-500/8",
        accent: "bg-emerald-400",
      };

    case "amber":
      return {
        icon: isActive
          ? "border-amber-400/40 bg-amber-400/20 text-amber-300"
          : "border-amber-500/20 bg-amber-500/10 text-amber-300",
        active:
          "border-amber-500/30 bg-amber-500/12 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.12)]",
        hover: "hover:border-amber-500/25 hover:bg-amber-500/8",
        accent: "bg-amber-400",
      };

    case "sky":
      return {
        icon: isActive
          ? "border-sky-400/40 bg-sky-400/20 text-sky-300"
          : "border-sky-500/20 bg-sky-500/10 text-sky-300",
        active:
          "border-sky-500/30 bg-sky-500/12 text-white shadow-[0_0_0_1px_rgba(14,165,233,0.12)]",
        hover: "hover:border-sky-500/25 hover:bg-sky-500/8",
        accent: "bg-sky-400",
      };

    case "rose":
      return {
        icon: isActive
          ? "border-rose-400/40 bg-rose-400/20 text-rose-300"
          : "border-rose-500/20 bg-rose-500/10 text-rose-300",
        active:
          "border-rose-500/30 bg-rose-500/12 text-white shadow-[0_0_0_1px_rgba(244,63,94,0.12)]",
        hover: "hover:border-rose-500/25 hover:bg-rose-500/8",
        accent: "bg-rose-400",
      };

    case "violet":
      return {
        icon: isActive
          ? "border-violet-400/40 bg-violet-400/20 text-violet-300"
          : "border-violet-500/20 bg-violet-500/10 text-violet-300",
        active:
          "border-violet-500/30 bg-violet-500/12 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.12)]",
        hover: "hover:border-violet-500/25 hover:bg-violet-500/8",
        accent: "bg-violet-400",
      };

    case "cyan":
      return {
        icon: isActive
          ? "border-cyan-400/40 bg-cyan-400/20 text-cyan-300"
          : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
        active:
          "border-cyan-500/30 bg-cyan-500/12 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.12)]",
        hover: "hover:border-cyan-500/25 hover:bg-cyan-500/8",
        accent: "bg-cyan-400",
      };

    case "orange":
      return {
        icon: isActive
          ? "border-orange-400/40 bg-orange-400/20 text-orange-300"
          : "border-orange-500/20 bg-orange-500/10 text-orange-300",
        active:
          "border-orange-500/30 bg-orange-500/12 text-white shadow-[0_0_0_1px_rgba(249,115,22,0.12)]",
        hover: "hover:border-orange-500/25 hover:bg-orange-500/8",
        accent: "bg-orange-400",
      };

    default:
      return {
        icon: isActive
          ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        active:
          "border-emerald-500/30 bg-emerald-500/12 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.12)]",
        hover: "hover:border-emerald-500/25 hover:bg-emerald-500/8",
        accent: "bg-emerald-400",
      };
  }
}
