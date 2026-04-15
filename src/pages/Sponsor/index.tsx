import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavigationButton from "@/components/ui/NavigationButton";
import { getSponsorProfile } from "@/lib/sponsorSession";
import { getSponsorFeatureIcon } from "@/lib/sponsorFeatureIcons";
import { sponsorNavigationTheme } from "@/lib/sponsorNavigationTheme";
import MainLayout from "@/components/layout/MainLayout";

export default function SponsorHomePage() {
  const navigate = useNavigate();
  const session = getSponsorProfile();

  const sponsorName = session?.sponsor.name ?? "Patrocinador";

  const visibleFeatures = useMemo(() => {
    return (session?.features ?? []).filter((item) => item.can_view);
  }, [session]);

  return (
    <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Área do patrocinador
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Olá, {sponsorName}
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Aqui ficam apenas as funções liberadas para o seu acesso.
          </p>
        </section>

        {visibleFeatures.length > 0 ? (
          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {visibleFeatures.map((feature) => {
              const Icon = getSponsorFeatureIcon(feature.icon);

              return (
                <NavigationButton
                  key={feature.key}
                  label={feature.label}
                  description={feature.description || "Abrir funcionalidade."}
                  onClick={() => {
                    if (feature.route) navigate(feature.route);
                  }}
                  icon={Icon}
                  color={sponsorNavigationTheme}
                />
              );
            })}
          </section>
        ) : (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Nenhuma função foi liberada para este patrocinador.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
