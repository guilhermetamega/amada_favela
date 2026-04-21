import { memo, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMobileNavRoutes } from "@/routes/route-config";
import { usePermissions } from "@/hooks/usePermissions";
import { getSidebarRouteTheme } from "@/lib/route-theme";

function MobileBottomNavComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions, isPartnerActive } = usePermissions();

  const routes = useMemo(
    () => getMobileNavRoutes(permissions).slice(0, 5),
    [permissions],
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 backdrop-blur md:hidden dark:border-zinc-800/80 dark:bg-zinc-950/95"
      aria-label="Navegação principal mobile"
    >
      <div className="mx-auto flex max-w-lg justify-between gap-1 px-6">
        {routes.map((route) => {
          const isActive =
            location.pathname === route.path ||
            location.pathname.startsWith(`${route.path}/`);

          const isPremium = !!route.isPremium;
          const shouldHighlightPremium = isPremium && !isPartnerActive;
          const Icon = route.icon;
          const theme = getSidebarRouteTheme(route.colorClass, isActive);

          return (
            <button
              key={route.path}
              type="button"
              onClick={() => navigate(route.path)}
              className={`relative flex min-h-17 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-2 py-2 transition duration-200 active:scale-[0.98] ${
                shouldHighlightPremium
                  ? isActive
                    ? "bg-amber-100/70 text-amber-950 shadow-[0_10px_24px_rgba(251,191,36,0.10)] dark:bg-amber-400/12 dark:text-amber-100"
                    : "text-amber-800 hover:bg-amber-50/70 dark:text-amber-200 dark:hover:bg-amber-400/8"
                  : isActive
                    ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
              aria-label={route.label}
            >
              {shouldHighlightPremium ? (
                <>
                  <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-amber-300/80 to-transparent opacity-80 blur-[1px] dark:via-amber-200/55" />
                  <span className="pointer-events-none absolute right-2 top-1.5 text-amber-500/70 dark:text-amber-300/70">
                    <Sparkles size={10} className="animate-pulse" />
                  </span>
                </>
              ) : null}

              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                  shouldHighlightPremium
                    ? isActive
                      ? "border-amber-200/70 bg-white/75 text-amber-700 shadow-[0_0_14px_rgba(251,191,36,0.14)] dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200"
                      : "border-transparent bg-amber-100/80 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200"
                    : theme.icon
                }`}
              >
                <Icon
                  size={18}
                  className={shouldHighlightPremium ? "animate-pulse" : ""}
                />
              </span>

              <span className="max-w-full truncate text-[11px] font-medium">
                {route.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const MobileBottomNav = memo(MobileBottomNavComponent);
export default MobileBottomNav;
