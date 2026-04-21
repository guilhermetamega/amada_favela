import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardModuleGrid from "@/components/dashboard/ModuleGrid";
import DashboardWarningCarousel from "@/components/dashboard/WarningCarousel";
import DashboardHeroSkeleton from "@/components/dashboard/HeroSkeleton";
import DashboardPollQueueModal from "@/components/dashboard/PollQueueModal";
import VoteConfirmModal from "@/components/polls/VoteConfirmModal";
import { usePermissions } from "@/hooks/usePermissions";
import { getDashboardRoutes } from "@/routes/route-config";
import { useDashboardWarnings } from "@/hooks/useDashboardWarnings";
import { useDashboardPolls } from "@/hooks/useDashboardPolls";
import Hero from "@/components/dashboard/Hero";
import MainLayout from "@/components/layout/MainLayout";
import {
  DashboardSponsorBannerItem,
  getDashboardSponsorBanners,
  resolveDashboardSponsorBannerAction,
} from "@/services/supabase/dashboard_sponsor_banners";
import { SponsorWeeklyAd } from "@/types/sponsor-weekly-ad";
import DashboardSponsorBannerCarousel from "@/components/dashboard/SponsorBannerCarousel";
import SponsorWeeklyAdModal from "@/components/dashboard/SponsorWeeklyAdModal";
import {
  createMembershipCheckout,
  getOpenMembershipPayment,
} from "@/services/supabase/membership";
import type { OpenMembershipPayment } from "@/types/membership";

export default function DashboardPage() {
  const {
    permissions,
    loading: permissionsLoading,
    isPartnerActive,
    refreshPermissions,
  } = usePermissions();
  const { warnings, loading: warningsLoading } = useDashboardWarnings();

  const [sponsorBanners, setSponsorBanners] = useState<
    DashboardSponsorBannerItem[]
  >([]);
  const [selectedWeeklyAd, setSelectedWeeklyAd] =
    useState<SponsorWeeklyAd | null>(null);
  const [payingMonthlyFee, setPayingMonthlyFee] = useState(false);
  const [openMembershipPayment, setOpenMembershipPayment] =
    useState<OpenMembershipPayment | null>(null);
  const [loadingOpenMembershipPayment, setLoadingOpenMembershipPayment] =
    useState(false);
  const [membershipErrorMessage, setMembershipErrorMessage] = useState("");

  const {
    polls,
    loading: pollsLoading,
    errorMessage: pollsErrorMessage,
    pendingVote,
    setPendingVote,
    confirmVote,
    voteLoading,
  } = useDashboardPolls();

  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [queueDismissed, setQueueDismissed] = useState(false);

  const dashboardRoutes = useMemo(
    () => getDashboardRoutes(permissions),
    [permissions],
  );

  const hasOpenMembershipPayment = useMemo(
    () => Boolean(openMembershipPayment),
    [openMembershipPayment],
  );

  const pendingPolls = useMemo(() => {
    return [...polls]
      .filter((poll) => !poll.has_voted && poll.voting_open && poll.visible_now)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [polls]);

  const activePoll = useMemo(() => {
    if (!pendingPolls.length || queueDismissed) return null;

    if (!activePollId) return pendingPolls[0] ?? null;
    return (
      pendingPolls.find((poll) => poll.id === activePollId) ??
      pendingPolls[0] ??
      null
    );
  }, [activePollId, pendingPolls, queueDismissed]);

  const activePollQueuePosition = useMemo(() => {
    if (!activePoll) return 0;
    return pendingPolls.findIndex((poll) => poll.id === activePoll.id) + 1;
  }, [activePoll, pendingPolls]);

  const refreshOpenMembershipPayment = useCallback(async () => {
    try {
      setLoadingOpenMembershipPayment(true);
      const payment = await getOpenMembershipPayment();
      setOpenMembershipPayment(payment);
    } catch (error) {
      console.error("[dashboard] refreshOpenMembershipPayment:error", {
        message: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      setLoadingOpenMembershipPayment(false);
    }
  }, []);

  function handleOpenSponsorBanner(item: DashboardSponsorBannerItem) {
    const action = resolveDashboardSponsorBannerAction(item);

    if (!action) return;

    if (action.type === "weekly_ad") {
      setSelectedWeeklyAd(action.weeklyAd);
    }
  }

  useEffect(() => {
    async function loadSponsorBanners() {
      try {
        const data = await getDashboardSponsorBanners();
        setSponsorBanners(data);
      } catch {
        setSponsorBanners([]);
      }
    }

    void loadSponsorBanners();
  }, []);

  useEffect(() => {
    void refreshOpenMembershipPayment();
  }, [refreshOpenMembershipPayment]);

  useEffect(() => {
    function handleFocus() {
      void refreshOpenMembershipPayment();
      void refreshPermissions();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshOpenMembershipPayment, refreshPermissions]);

  useEffect(() => {
    if (pollsLoading || queueDismissed) return;

    if (!pendingPolls.length) {
      if (activePollId !== null) {
        setActivePollId(null);
      }
      return;
    }

    if (pendingVote) return;

    const currentStillExists =
      activePollId && pendingPolls.some((poll) => poll.id === activePollId);

    if (currentStillExists) return;

    setActivePollId(pendingPolls[0].id);
  }, [pollsLoading, pendingPolls, pendingVote, activePollId, queueDismissed]);

  function handleClosePollQueue() {
    setQueueDismissed(true);
    setActivePollId(null);
  }

  function handleSelectPollOption(
    pollId: string,
    optionId: string,
    optionLabel: string,
  ) {
    setQueueDismissed(false);
    setPendingVote({ pollId, optionId, optionLabel });
  }

  async function handleConfirmVote() {
    const currentPollId = pendingVote?.pollId ?? null;

    await confirmVote();

    if (!currentPollId) return;

    const remaining = pendingPolls.filter((poll) => poll.id !== currentPollId);
    setActivePollId(remaining[0]?.id ?? null);
  }

  async function handlePayMonthlyFeeClick() {
    if (
      payingMonthlyFee ||
      isPartnerActive ||
      hasOpenMembershipPayment ||
      loadingOpenMembershipPayment
    ) {
      return;
    }

    try {
      setPayingMonthlyFee(true);
      setMembershipErrorMessage("");

      const { url, sessionId } = await createMembershipCheckout(true);

      setOpenMembershipPayment({
        id: `local-${Date.now()}`,
        status: "pending",
        created_at: new Date().toISOString(),
        checkout_mode: "subscription",
        stripe_checkout_session_id: sessionId,
      });

      window.location.assign(url);
    } catch (error) {
      console.error("[dashboard] membership-checkout:error", {
        message: error instanceof Error ? error.message : "unknown",
      });

      setMembershipErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento da mensalidade.",
      );
    } finally {
      setPayingMonthlyFee(false);
    }
  }

  return (
    <DashboardLayout hasLogo>
      <MainLayout>
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <Hero />
          </div>

          {pollsErrorMessage ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {pollsErrorMessage}
            </div>
          ) : null}

          {membershipErrorMessage ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {membershipErrorMessage}
            </div>
          ) : null}

          {!warningsLoading && warnings.length > 0 ? (
            <DashboardWarningCarousel items={warnings} />
          ) : null}
          <DashboardSponsorBannerCarousel
            items={sponsorBanners}
            onOpen={handleOpenSponsorBanner}
          />

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
            <DashboardModuleGrid
              routes={dashboardRoutes}
              hasActivePartner={isPartnerActive}
              payingMonthlyFee={payingMonthlyFee}
              hasOpenMembershipPayment={hasOpenMembershipPayment}
              openMembershipPaymentStatus={
                openMembershipPayment?.status ?? null
              }
              loadingOpenMembershipPayment={loadingOpenMembershipPayment}
              onPayMonthlyFeeClick={handlePayMonthlyFeeClick}
            />
          )}
        </div>
      </MainLayout>

      <DashboardPollQueueModal
        open={!!activePoll && !pendingVote && !queueDismissed}
        poll={activePoll}
        queuePosition={activePollQueuePosition}
        queueTotal={pendingPolls.length}
        onSelect={handleSelectPollOption}
        onClose={handleClosePollQueue}
      />

      <VoteConfirmModal
        open={!!pendingVote}
        optionLabel={pendingVote?.optionLabel ?? ""}
        loading={voteLoading}
        onClose={() => setPendingVote(null)}
        onConfirm={handleConfirmVote}
      />

      <SponsorWeeklyAdModal
        open={!!selectedWeeklyAd}
        item={selectedWeeklyAd}
        onClose={() => setSelectedWeeklyAd(null)}
      />
    </DashboardLayout>
  );
}
