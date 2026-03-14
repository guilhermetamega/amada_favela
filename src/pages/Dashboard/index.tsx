import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getDashboardRoutes } from "@/routes/route-config";
import { usePermissions } from "@/hooks/usePermissions";
import { getCurrentCommunityWarningBanners } from "@/services/supabase/warning_banners";
import type { WarningBanner } from "@/types/warning_banners";
import warningBg from "@/assets/warning_bg.png";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { permissions, loading } = usePermissions();

  const [warnings, setWarnings] = useState<WarningBanner[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(true);
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);

  const dashboardRoutes = useMemo(
    () => getDashboardRoutes(permissions),
    [permissions],
  );

  useEffect(() => {
    async function loadWarnings() {
      try {
        setWarningsLoading(true);
        const data = await getCurrentCommunityWarningBanners();
        setWarnings(data);
      } catch {
        setWarnings([]);
      } finally {
        setWarningsLoading(false);
      }
    }

    void loadWarnings();
  }, []);

  useEffect(() => {
    if (warnings.length === 0) {
      setCurrentWarningIndex(0);
      return;
    }

    if (currentWarningIndex > warnings.length - 1) {
      setCurrentWarningIndex(0);
    }
  }, [warnings, currentWarningIndex]);

  function handlePreviousWarning() {
    if (warnings.length <= 1) return;

    setCurrentWarningIndex((prev) =>
      prev === 0 ? warnings.length - 1 : prev - 1,
    );
  }

  function handleNextWarning() {
    if (warnings.length <= 1) return;

    setCurrentWarningIndex((prev) =>
      prev === warnings.length - 1 ? 0 : prev + 1,
    );
  }

  const currentWarning = warnings[currentWarningIndex];

  return (
    <DashboardLayout>
      <main className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader
            title="Dashboard"
            description="Escolha uma funcionalidade para continuar."
          />

          {!warningsLoading && currentWarning ? (
            <section className="mb-8">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
                <article
                  className="relative min-h-[220px] overflow-hidden md:min-h-[280px]"
                  style={{
                    backgroundImage: `url(${warningBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/80" />

                  <div className="relative flex min-h-[220px] items-center justify-center px-6 py-8 text-center md:min-h-[280px] md:px-8 md:py-10">
                    <p
                      className="max-w-3xl text-lg font-semibold md:text-2xl"
                      style={{ color: currentWarning.text_color }}
                    >
                      {currentWarning.message}
                    </p>
                  </div>

                  {warnings.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePreviousWarning}
                        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white transition hover:bg-black/60"
                        aria-label="Comunicado anterior"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={handleNextWarning}
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white transition hover:bg-black/60"
                        aria-label="Próximo comunicado"
                      >
                        →
                      </button>
                    </>
                  ) : null}
                </article>

                {warnings.length > 1 ? (
                  <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center gap-2 bg-gradient-to-t from-black/50 to-transparent px-4 py-4">
                    {warnings.map((warning, index) => (
                      <button
                        key={warning.id}
                        type="button"
                        onClick={() => setCurrentWarningIndex(index)}
                        className={`h-2.5 rounded-full transition ${
                          currentWarningIndex === index
                            ? "w-8 bg-white"
                            : "w-2.5 bg-white/50 hover:bg-white/70"
                        }`}
                        aria-label={`Ir para comunicado ${index + 1}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

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
