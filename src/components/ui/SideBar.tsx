import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/client";
import { getSidebarRoutes } from "@/routes/route-config";
import { usePermissions } from "@/hooks/usePermissions";

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
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-lg hover:bg-zinc-800"
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-zinc-800 bg-zinc-900 p-6 transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <h2 className="mb-8 text-xl font-bold text-white">AMA da Favela</h2>

            <nav className="space-y-2">
              {loading ? (
                <div className="rounded-lg px-4 py-3 text-sm text-zinc-400">
                  Carregando menu...
                </div>
              ) : (
                sidebarRoutes.map((route) => {
                  const isActive =
                    location.pathname === route.path ||
                    (route.path !== "/dashboard" &&
                      location.pathname.startsWith(`${route.path}/`));

                  return (
                    <button
                      key={route.path}
                      onClick={() => handleNavigate(route.path)}
                      className={`w-full rounded-lg px-4 py-3 text-left transition ${
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {route.label}
                    </button>
                  );
                })
              )}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500/10 px-4 py-3 text-left text-red-400 hover:bg-red-500/20"
          >
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  );
}
