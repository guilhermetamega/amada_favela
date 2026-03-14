import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getDashboardRoutes } from "@/routes/route-config";
import { usePermissions } from "@/hooks/usePermissions";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { permissions, loading } = usePermissions();

  const dashboardRoutes = useMemo(
    () => getDashboardRoutes(permissions),
    [permissions],
  );

  return (
    <DashboardLayout>
      <main className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader
            title="Dashboard"
            description="Escolha uma funcionalidade para continuar."
          />

          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Carregando módulos...
            </div>
          ) : null}

          {!loading && dashboardRoutes.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Nenhuma funcionalidade disponível para o seu perfil.
            </div>
          ) : null}

          {!loading && dashboardRoutes.length > 0 ? (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
              {dashboardRoutes.map((route) => (
                <button
                  key={route.path}
                  type="button"
                  onClick={() => navigate(route.path)}
                  className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {route.label}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-400">
                        {route.description || "Abrir funcionalidade."}
                      </p>
                    </div>

                    <span className="text-sm font-medium text-zinc-300">
                      Abrir módulo →
                    </span>
                  </div>
                </button>
              ))}
            </section>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
