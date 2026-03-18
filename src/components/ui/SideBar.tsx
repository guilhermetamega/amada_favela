import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/services/supabase/client";
import { getSidebarRoutes } from "@/routes/route-config";
import { usePermissions } from "@/hooks/usePermissions";
import { getSidebarRouteTheme } from "@/lib/route-theme";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { permissions, loading } = usePermissions();

  const sidebarRoutes = useMemo(
    () => getSidebarRoutes(permissions),
    [permissions],
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  function handleNavigate(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/95 text-white shadow-lg backdrop-blur transition hover:border-zinc-700 hover:bg-zinc-800"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`no-scrollbar fixed left-0 top-0 z-50 flex h-full w-74 transform flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-400/80">
              Comunidade
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">AMA da Favela</h2>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-400">
              Carregando menu...
            </div>
          ) : (
            sidebarRoutes.map((route) => {
              const isActive =
                location.pathname === route.path ||
                (route.path !== "/dashboard" &&
                  location.pathname.startsWith(`${route.path}/`));

              const Icon = route.icon;
              const theme = getSidebarRouteTheme(route.colorClass, isActive);

              return (
                <button
                  key={route.path}
                  type="button"
                  onClick={() => handleNavigate(route.path)}
                  className={`group relative w-full overflow-hidden rounded-2xl border px-3 py-3 text-left transition ${
                    isActive
                      ? `${theme.active}`
                      : `border-zinc-800 bg-zinc-900/70 text-zinc-200 ${theme.hover}`
                  }`}
                >
                  {isActive ? (
                    <span
                      className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl ${theme.accent}`}
                    />
                  ) : null}

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${theme.icon}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {route.label}
                      </p>

                      {route.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400 group-hover:text-zinc-300">
                          {route.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </nav>

        <div className="mt-4 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-red-300 transition hover:border-red-500/30 hover:bg-red-500/15"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
              <LogOut size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold">Sair da conta</p>
              <p className="text-xs text-red-300/80">Encerrar a sessão atual</p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
