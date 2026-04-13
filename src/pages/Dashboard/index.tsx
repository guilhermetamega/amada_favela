import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardModuleGrid from "@/components/dashboard/ModuleGrid";
import DashboardWarningCarousel from "@/components/dashboard/WarningCarousel";
import DashboardHeroSkeleton from "@/components/dashboard/HeroSkeleton";
import PollCarousel from "@/components/dashboard/PollsCarousel";
import DashboardPollModal from "@/components/dashboard/PollModal";
import VoteConfirmModal from "@/components/polls/VoteConfirmModal";
import { usePermissions } from "@/hooks/usePermissions";
import { getDashboardRoutes } from "@/routes/route-config";
import { useDashboardWarnings } from "@/hooks/useDashboardWarnings";
import { useDashboardPolls } from "@/hooks/useDashboardPolls";
import Hero from "@/components/dashboard/Hero";
import MainLayout from "@/components/layout/MainLayout";
import type { Poll } from "@/types/polls";

export default function DashboardPage() {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { warnings, loading: warningsLoading } = useDashboardWarnings();

  const {
    polls,
    loading: pollsLoading,
    pendingVote,
    setPendingVote,
    confirmVote,
    voteLoading,
  } = useDashboardPolls();

  const [activePoll, setActivePoll] = useState<Poll | null>(null);

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

          {!pollsLoading && polls.length > 0 ? (
            <PollCarousel
              items={polls}
              onOpen={(poll) => setActivePoll(poll)}
            />
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

      <DashboardPollModal
        open={!!activePoll}
        poll={activePoll}
        onClose={() => setActivePoll(null)}
        onVote={(pollId, optionId, optionLabel) => {
          setPendingVote({ pollId, optionId, optionLabel });
        }}
      />

      <VoteConfirmModal
        open={!!pendingVote}
        optionLabel={pendingVote?.optionLabel ?? ""}
        loading={voteLoading}
        onClose={() => setPendingVote(null)}
        onConfirm={confirmVote}
      />
    </DashboardLayout>
  );
}
