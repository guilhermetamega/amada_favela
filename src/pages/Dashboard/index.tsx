import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getDashboardRoutes } from "@/routes/route-config";
import { usePermissions } from "@/hooks/usePermissions";
import { getCurrentCommunityWarningBanners } from "@/services/supabase/warning_banners";
import type { WarningBanner } from "@/types/warning_banners";
import warningBg from "@/assets/warning_bg.png";
import { getDashboardRouteTheme } from "@/lib/route-theme";
import { useImagePreload } from "@/hooks/useImagePreload";
import NavigationButton from "@/components/ui/NavigationButton";

function WarningBannerSkeleton() {
  return (
    <section className="mb-6 md:mb-8">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="relative min-h-[180px] sm:min-h-[200px] md:min-h-[280px]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800" />

          <div className="relative flex min-h-[180px] items-center justify-center px-5 py-8 sm:min-h-[200px] sm:px-6 md:min-h-[280px] md:px-8 md:py-10">
            <div className="w-full max-w-3xl space-y-3">
              <div className="mx-auto h-4 w-5/6 rounded-full bg-zinc-700/70 sm:h-5" />
              <div className="mx-auto h-4 w-4/6 rounded-full bg-zinc-700/60 sm:h-5" />
              <div className="mx-auto h-4 w-3/6 rounded-full bg-zinc-700/50 sm:h-5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 px-4 py-4">
            <div className="h-2.5 w-8 rounded-full bg-zinc-700/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-700/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-700/50" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { permissions, loading } = usePermissions();

  const [warnings, setWarnings] = useState<WarningBanner[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(true);
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);

  const { loaded: warningBgLoaded, error: warningBgError } =
    useImagePreload(warningBg);

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
  const canRenderWarningBanner =
    !warningsLoading && !!currentWarning && (warningBgLoaded || warningBgError);

  return (
    <DashboardLayout>
      <main className="px-4 py-6 sm:py-8 md:py-10">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader
            title="Dashboard"
            description="Escolha uma funcionalidade para continuar."
          />

          {warningsLoading || (!warningBgLoaded && !warningBgError) ? (
            <WarningBannerSkeleton />
          ) : null}

          {canRenderWarningBanner ? (
            <section className="mb-6 md:mb-8">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
                <article
                  className="relative min-h-[180px] overflow-hidden sm:min-h-[200px] md:min-h-[280px]"
                  style={{
                    backgroundImage: warningBgError
                      ? undefined
                      : `url(${warningBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "#18181b",
                  }}
                >
                  <div className="absolute inset-0 bg-black/75" />

                  <div className="relative flex min-h-[180px] items-center justify-center px-5 py-8 text-center sm:min-h-[200px] sm:px-6 md:min-h-[280px] md:px-8 md:py-10">
                    <p
                      className="max-w-3xl text-base font-semibold sm:text-lg md:text-2xl"
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
                        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        aria-label="Comunicado anterior"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={handleNextWarning}
                        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
                            ? "w-8 bg-emerald-400"
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
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-300 md:p-6">
              Carregando módulos...
            </div>
          ) : null}

          {!loading && dashboardRoutes.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-300 md:p-6">
              Nenhuma funcionalidade disponível para o seu perfil.
            </div>
          ) : null}

          {!loading && dashboardRoutes.length > 0 ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5">
              {dashboardRoutes.map((route) => {
                const color = getDashboardRouteTheme(route.colorClass);

                return (
                  <NavigationButton
                    key={route.path}
                    label={route.label}
                    description={route.description}
                    icon={route.icon}
                    color={color}
                    onClick={() => navigate(route.path)}
                  />
                );
              })}
            </section>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
