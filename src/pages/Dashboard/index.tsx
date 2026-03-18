import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative min-h-45 sm:min-h-50 md:min-h-70">
          <div className="absolute inset-0 animate-pulse bg-linear-to-br from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800" />

          <div className="relative flex min-h-45 items-center justify-center px-5 py-8 sm:min-h-50 sm:px-6 md:min-h-70 md:px-8 md:py-10">
            <div className="w-full max-w-3xl space-y-3">
              <div className="mx-auto h-4 w-5/6 rounded-full bg-zinc-300/70 dark:bg-zinc-700/70 sm:h-5" />
              <div className="mx-auto h-4 w-4/6 rounded-full bg-zinc-300/60 dark:bg-zinc-700/60 sm:h-5" />
              <div className="mx-auto h-4 w-3/6 rounded-full bg-zinc-300/50 dark:bg-zinc-700/50 sm:h-5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 px-4 py-4">
            <div className="h-2.5 w-8 rounded-full bg-zinc-400/80 dark:bg-zinc-700/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-300/70 dark:bg-zinc-700/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-300/70 dark:bg-zinc-700/50" />
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
      <main className="min-h-full bg-zinc-50 px-4 py-6 text-zinc-900 transition-colors sm:py-8 md:py-10 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto max-w-5xl">
          {warningsLoading || (!warningBgLoaded && !warningBgError) ? (
            <WarningBannerSkeleton />
          ) : null}

          {canRenderWarningBanner ? (
            <section className="mb-6 md:mb-8">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800">
                <article
                  className={`relative min-h-45 overflow-hidden sm:min-h-50 md:min-h-70 ${
                    warningBgError ? "bg-zinc-200 dark:bg-zinc-800" : ""
                  }`}
                  style={
                    warningBgError
                      ? undefined
                      : {
                          backgroundImage: `url(${warningBg})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                  }
                >
                  <div className="absolute inset-0 bg-white/55 dark:bg-black/70" />

                  <div className="relative flex min-h-45 items-center justify-center px-5 py-8 text-center sm:min-h-50 sm:px-6 md:min-h-70 md:px-8 md:py-10">
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
                        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-300 bg-white/85 px-3 py-2 text-zinc-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-black/45 dark:text-white dark:hover:bg-black/60 dark:focus-visible:ring-white/70"
                        aria-label="Comunicado anterior"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={handleNextWarning}
                        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-300 bg-white/85 px-3 py-2 text-zinc-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-black/45 dark:text-white dark:hover:bg-black/60 dark:focus-visible:ring-white/70"
                        aria-label="Próximo comunicado"
                      >
                        →
                      </button>
                    </>
                  ) : null}
                </article>

                {warnings.length > 1 ? (
                  <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center gap-2 bg-linear-to-t from-white/75 to-transparent px-4 py-4 dark:from-black/50">
                    {warnings.map((warning, index) => (
                      <button
                        key={warning.id}
                        type="button"
                        onClick={() => setCurrentWarningIndex(index)}
                        className={`h-2.5 rounded-full transition ${
                          currentWarningIndex === index
                            ? "w-8 bg-emerald-500 dark:bg-emerald-400"
                            : "w-2.5 bg-zinc-500/50 hover:bg-zinc-500/70 dark:bg-white/50 dark:hover:bg-white/70"
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
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm md:p-6 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Carregando módulos...
            </div>
          ) : null}

          {!loading && dashboardRoutes.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm md:p-6 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Nenhuma funcionalidade disponível para o seu perfil.
            </div>
          ) : null}

          {!loading && dashboardRoutes.length > 0 ? (
            <section className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-5">
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
