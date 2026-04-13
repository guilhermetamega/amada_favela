import { useMemo } from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardModuleGrid from "@/components/dashboard/ModuleGrid";
import DashboardWarningCarousel from "@/components/dashboard/WarningCarousel";
import DashboardHeroSkeleton from "@/components/dashboard/HeroSkeleton";
import { usePermissions } from "@/hooks/usePermissions";
import { getDashboardRoutes } from "@/routes/route-config";
import { useDashboardWarnings } from "@/hooks/useDashboardWarnings";
import Hero from "@/components/dashboard/Hero";
import MainLayout from "@/components/layout/MainLayout";

export default function DashboardPage() {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { warnings, loading: warningsLoading } = useDashboardWarnings();

  const dashboardRoutes = useMemo(
    () => getDashboardRoutes(permissions),
    [permissions],
  );

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <Hero />
          </div>

          {!warningsLoading && warnings.length > 0 ? (
            <DashboardWarningCarousel items={warnings} />
          ) : null}

          {permissionsLoading ? (
            <>
              <DashboardHeroSkeleton />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="min-h-37.5 animate-pulse rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  />
                ))}
              </div>
            </>
          ) : (
            <DashboardModuleGrid routes={dashboardRoutes} />
          )}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
