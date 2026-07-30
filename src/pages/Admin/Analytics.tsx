import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarPlus,
  Clock3,
  CreditCard,
  DollarSign,
  RefreshCw,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import AnalyticsFilters from "@/components/admin/analytics/AnalyticsFilters";
import AnalyticsMetricCard from "@/components/admin/analytics/AnalyticsMetricCard";
import RevenueChart from "@/components/admin/analytics/RevenueChart";
import PaymentStatusChart from "@/components/admin/analytics/PaymentStatusChart";
import ProviderDistributionChart from "@/components/admin/analytics/ProviderDistributionChart";
import MembershipDistributionChart from "@/components/admin/analytics/MembershipDistributionChart";
import UserGrowthChart from "@/components/admin/analytics/UserGrowthChart";
import StreetSummary from "@/components/admin/analytics/StreetSummary";
import AnalyticsPageSkeleton from "@/components/admin/analytics/AnalyticsPageSkeleton";
import AnalyticsSegmentUsersDialog from "@/components/admin/analytics/AnalyticsSegmentUsersDialog";
import { usePermissions } from "@/hooks/usePermissions";
import {
  DEFAULT_ANALYTICS_FILTERS,
  formatAnalyticsPeriod,
} from "@/lib/admin-analytics";
import {
  clearAssociationAnalyticsCache,
  getAssociationAnalyticsDashboard,
} from "@/services/supabase/admin-analytics";
import { clearAnalyticsSegmentUsersCache } from "@/services/supabase/admin-analytics-segments";
import type {
  AnalyticsDashboardFilters,
  AssociationAnalyticsDashboard,
} from "@/types/admin-analytics";
import type { AnalyticsMemberSegment } from "@/types/admin-analytics-segments";

export default function AdminAnalyticsPage() {
  const { permissions } = usePermissions();

  const [draftFilters, setDraftFilters] = useState<AnalyticsDashboardFilters>({
    ...DEFAULT_ANALYTICS_FILTERS,
  });

  const [appliedFilters, setAppliedFilters] =
    useState<AnalyticsDashboardFilters>({
      ...DEFAULT_ANALYTICS_FILTERS,
    });

  const [dashboard, setDashboard] =
    useState<AssociationAnalyticsDashboard | null>(null);

  const [selectedSegment, setSelectedSegment] =
    useState<AnalyticsMemberSegment | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const requestIdRef = useRef(0);

  const hasLoadedRef = useRef(false);

  const loadDashboard = useCallback(
    async (force = false) => {
      const requestId = ++requestIdRef.current;

      try {
        if (hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const data = await getAssociationAnalyticsDashboard(appliedFilters, {
          force,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setDashboard(data);

        hasLoadedRef.current = true;
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os indicadores.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function handleApplyFilters() {
    const currentKey = JSON.stringify(appliedFilters);

    const nextKey = JSON.stringify(draftFilters);

    setSelectedSegment(null);
    clearAnalyticsSegmentUsersCache();

    if (currentKey === nextKey) {
      void loadDashboard(true);
      return;
    }

    setAppliedFilters({
      ...draftFilters,
    });
  }

  function handleResetFilters() {
    const defaults = {
      ...DEFAULT_ANALYTICS_FILTERS,
    };

    setSelectedSegment(null);

    setDraftFilters(defaults);

    setAppliedFilters(defaults);

    clearAssociationAnalyticsCache();
    clearAnalyticsSegmentUsersCache();
  }

  function handleManualRefresh() {
    setSelectedSegment(null);

    clearAssociationAnalyticsCache();
    clearAnalyticsSegmentUsersCache();

    void loadDashboard(true);
  }

  if (loading && !dashboard) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-7xl">
            <AnalyticsPageSkeleton />
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  if (!dashboard) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-3xl py-6">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
              <h1 className="text-xl font-bold text-red-800 dark:text-red-300">
                Não foi possível carregar o dashboard
              </h1>

              <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={handleManualRefresh}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw size={17} />
                Tentar novamente
              </button>
            </div>
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  const { overview } = dashboard;

  const canOpenSegmentUsers = permissions?.canAccessUserAdministration === true;

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl space-y-5 pb-8">
          <header className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
                Indicadores financeiros e de sócios
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {dashboard.context.scopeLabel} ·{" "}
                {formatAnalyticsPeriod(
                  dashboard.period.startDate,

                  dashboard.period.endDate,
                )}
              </p>
              <button
                type="button"
                disabled={refreshing}
                onClick={handleManualRefresh}
                className="inline-flex mt-3 h-11 items-center justify-center gap-2 self-start rounded-2xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Atualizar
              </button>
            </div>
          </header>

          <AnalyticsFilters
            filters={draftFilters}
            context={dashboard.context}
            availableStreets={dashboard.availableStreets}
            loading={refreshing}
            onChange={setDraftFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs leading-5 text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
            Gateway, status e tipo de cobrança afetam os indicadores
            financeiros. Comunidade, rua e período também afetam os dados de
            usuários e sócios relacionados.
          </div>

          <section
            className={[
              "grid grid-cols-2 gap-3 transition lg:grid-cols-4",
              refreshing ? "opacity-65" : "",
            ].join(" ")}
          >
            <AnalyticsMetricCard
              label="Arrecadação bruta"
              description="Pagamentos aprovados no período."
              metric={overview.grossRevenueCents}
              icon={DollarSign}
              format="currency"
              tone="cyan"
            />

            <AnalyticsMetricCard
              label="Repasse líquido à associação"
              description="Valor efetivamente destinado à associação."
              metric={overview.associationNetCents}
              icon={TrendingUp}
              format="currency"
              tone="emerald"
            />

            <AnalyticsMetricCard
              label="Pagamentos aprovados"
              description="Quantidade de pagamentos concluídos."
              metric={overview.approvedPayments}
              icon={ReceiptText}
              format="number"
              tone="violet"
            />

            <AnalyticsMetricCard
              label="Ticket médio"
              description="Valor médio por pagamento aprovado."
              metric={overview.averageTicketCents}
              icon={CreditCard}
              format="currency"
              tone="amber"
            />

            <AnalyticsMetricCard
              label="Sócios ativos"
              description="Vínculos ativos e ainda não vencidos."
              metric={overview.activeMembers}
              icon={BadgeCheck}
              format="number"
              tone="emerald"
            />

            <AnalyticsMetricCard
              label="Novos pagantes"
              description="Primeiro pagamento aprovado no período."
              metric={overview.newPayingMembers}
              icon={CalendarPlus}
              format="number"
              tone="cyan"
            />

            <AnalyticsMetricCard
              label="Próximos do vencimento"
              description="Vínculos que vencem em até sete dias."
              metric={overview.expiringSoon}
              icon={Clock3}
              format="number"
              tone="amber"
            />

            <AnalyticsMetricCard
              label="Pagaram uma vez"
              description="Usuários com um único pagamento aprovado."
              metric={overview.paidOnce}
              icon={CreditCard}
              format="number"
              tone="violet"
            />
          </section>

          <section
            className={[
              "grid min-w-0 gap-5 xl:grid-cols-2",
              refreshing ? "opacity-65" : "",
            ].join(" ")}
          >
            <div className="min-w-0 xl:col-span-2">
              <RevenueChart
                data={dashboard.financialSeries}
                period={dashboard.period}
              />
            </div>

            <PaymentStatusChart data={dashboard.paymentStatusDistribution} />

            <ProviderDistributionChart data={dashboard.providerDistribution} />

            <MembershipDistributionChart
              data={dashboard.memberSegments}
              interactive={canOpenSegmentUsers}
              onSegmentClick={setSelectedSegment}
            />

            <UserGrowthChart
              data={dashboard.userGrowthSeries}
              period={dashboard.period}
            />

            <div className="min-w-0 xl:col-span-2">
              <StreetSummary data={dashboard.streetSummary} />
            </div>
          </section>

          <footer className="text-center text-xs text-zinc-400">
            Atualizado em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",

              timeStyle: "short",
            }).format(new Date(dashboard.generatedAt))}
          </footer>
        </div>

        <AnalyticsSegmentUsersDialog
          isOpen={selectedSegment !== null}
          segment={selectedSegment}
          filters={appliedFilters}
          scopeLabel={dashboard.context.scopeLabel}
          onClose={() => setSelectedSegment(null)}
        />
      </MainLayout>
    </DashboardLayout>
  );
}
