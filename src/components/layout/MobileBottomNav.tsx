import { memo, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMobileNavRoutes } from "@/routes/route-config";
import { usePermissions } from "@/hooks/usePermissions";
import { getSidebarRouteTheme } from "@/lib/route-theme";

function MobileBottomNavComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = usePermissions();

  const routes = useMemo(
    () => getMobileNavRoutes(permissions).slice(0, 5),
    [permissions],
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
      aria-label="Navegação principal mobile"
    >
      <div className="mx-auto flex justify-between max-w-lg gap-1 px-6">
        {routes.map((route) => {
          const isActive =
            location.pathname === route.path ||
            location.pathname.startsWith(`${route.path}/`);

          const Icon = route.icon;
          const theme = getSidebarRouteTheme(route.colorClass, isActive);

          return (
            <button
              key={route.path}
              type="button"
              onClick={() => navigate(route.path)}
              className={`flex min-h-17 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition ${
                isActive
                  ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
              aria-label={route.label}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${theme.icon}`}
              >
                <Icon size={18} />
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
