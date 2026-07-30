import { supabase } from "@/services/supabase/client";
import type {
  AnalyticsDashboardFilters,
  AnalyticsMemberSegmentItem,
  AnalyticsMetric,
  AnalyticsMetricTrend,
  AnalyticsPaymentStatusItem,
  AnalyticsProviderItem,
  AnalyticsStreetSummaryItem,
  AnalyticsUserGrowthItem,
  AssociationAnalyticsDashboard,
} from "@/types/admin-analytics";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  expiresAt: number;
  data: AssociationAnalyticsDashboard;
};

const dashboardCache = new Map<string, CacheEntry>();

const inFlightRequests = new Map<
  string,
  Promise<AssociationAnalyticsDashboard>
>();

type MetricRow = {
  current: number | string;
  previous: number | string | null;
  change_percentage: number | string | null;
  trend: AnalyticsMetricTrend;
  comparison_available: boolean;
};

type DashboardRow = {
  generated_at: string;

  context: {
    actor_role: "admin" | "president" | "employee";
    scope_community: string | null;
    scope_label: string;
    is_global_scope: boolean;
    available_communities: Array<{
      key: string;
      label: string;
    }>;
  };

  period: {
    preset: AssociationAnalyticsDashboard["period"]["preset"];
    start_date: string;
    end_date: string;
    previous_start_date: string | null;
    previous_end_date: string | null;
    comparison_available: boolean;
    granularity: AssociationAnalyticsDashboard["period"]["granularity"];
    timezone: string;
  };

  available_streets: string[];

  overview: {
    gross_revenue_cents: MetricRow;
    association_net_cents: MetricRow;
    approved_payments: MetricRow;
    average_ticket_cents: MetricRow;
    active_members: MetricRow;
    new_paying_members: MetricRow;
    expiring_soon: MetricRow;
    paid_once: MetricRow;
  };

  financial_series: Array<{
    bucket_start: string;
    gross_cents: number | string;
    net_cents: number | string;
    platform_fee_cents: number | string;
    gateway_fee_cents: number | string;
    approved_payment_count: number | string;
  }>;

  payment_status_distribution: Array<{
    status: string;
    payment_count: number | string;
    amount_cents: number | string;
  }>;

  provider_distribution: Array<{
    provider: string;
    payment_count: number | string;
    approved_payment_count: number | string;
    gross_cents: number | string;
    net_cents: number | string;
    average_ticket_cents: number | string;
    approval_rate: number | string;
  }>;

  member_segments: Array<{
    segment: string;
    total: number | string;
  }>;

  user_growth_series: Array<{
    bucket_start: string;
    registered_users: number | string;
    new_paying_users: number | string;
  }>;

  street_summary: Array<{
    street: string;
    registered_users: number | string;
    paying_users: number | string;
    active_members: number | string;
    gross_cents: number | string;
    conversion_rate: number | string;
  }>;
};

function mapMetric(row: MetricRow): AnalyticsMetric {
  return {
    current: Number(row?.current ?? 0),

    previous:
      row?.previous === null || row?.previous === undefined
        ? null
        : Number(row.previous),

    changePercentage:
      row?.change_percentage === null || row?.change_percentage === undefined
        ? null
        : Number(row.change_percentage),

    trend: row?.trend ?? "unavailable",

    comparisonAvailable: row?.comparison_available === true,
  };
}

function mapDashboard(row: DashboardRow): AssociationAnalyticsDashboard {
  const paymentStatusDistribution: AnalyticsPaymentStatusItem[] = Array.isArray(
    row.payment_status_distribution,
  )
    ? row.payment_status_distribution.map((item) => ({
        status: item.status,
        paymentCount: Number(item.payment_count ?? 0),
        amountCents: Number(item.amount_cents ?? 0),
      }))
    : [];

  const providerDistribution: AnalyticsProviderItem[] = Array.isArray(
    row.provider_distribution,
  )
    ? row.provider_distribution.map((item) => ({
        provider: item.provider,
        paymentCount: Number(item.payment_count ?? 0),

        approvedPaymentCount: Number(item.approved_payment_count ?? 0),

        grossCents: Number(item.gross_cents ?? 0),
        netCents: Number(item.net_cents ?? 0),

        averageTicketCents: Number(item.average_ticket_cents ?? 0),

        approvalRate: Number(item.approval_rate ?? 0),
      }))
    : [];

  const memberSegments: AnalyticsMemberSegmentItem[] = Array.isArray(
    row.member_segments,
  )
    ? row.member_segments.map((item) => ({
        segment: item.segment,
        total: Number(item.total ?? 0),
      }))
    : [];

  const userGrowthSeries: AnalyticsUserGrowthItem[] = Array.isArray(
    row.user_growth_series,
  )
    ? row.user_growth_series.map((item) => ({
        bucketStart: item.bucket_start,
        registeredUsers: Number(item.registered_users ?? 0),
        newPayingUsers: Number(item.new_paying_users ?? 0),
      }))
    : [];

  const streetSummary: AnalyticsStreetSummaryItem[] = Array.isArray(
    row.street_summary,
  )
    ? row.street_summary.map((item) => ({
        street: item.street,
        registeredUsers: Number(item.registered_users ?? 0),
        payingUsers: Number(item.paying_users ?? 0),
        activeMembers: Number(item.active_members ?? 0),
        grossCents: Number(item.gross_cents ?? 0),
        conversionRate: Number(item.conversion_rate ?? 0),
      }))
    : [];

  return {
    generatedAt: row.generated_at,

    context: {
      actorRole: row.context.actor_role,
      scopeCommunity: row.context.scope_community,
      scopeLabel: row.context.scope_label,
      isGlobalScope: row.context.is_global_scope,

      availableCommunities: Array.isArray(row.context.available_communities)
        ? row.context.available_communities
        : [],
    },

    period: {
      preset: row.period.preset,
      startDate: row.period.start_date,
      endDate: row.period.end_date,
      previousStartDate: row.period.previous_start_date,
      previousEndDate: row.period.previous_end_date,

      comparisonAvailable: row.period.comparison_available,

      granularity: row.period.granularity,
      timezone: row.period.timezone,
    },

    availableStreets: Array.isArray(row.available_streets)
      ? row.available_streets
      : [],

    overview: {
      grossRevenueCents: mapMetric(row.overview.gross_revenue_cents),

      associationNetCents: mapMetric(row.overview.association_net_cents),

      approvedPayments: mapMetric(row.overview.approved_payments),

      averageTicketCents: mapMetric(row.overview.average_ticket_cents),

      activeMembers: mapMetric(row.overview.active_members),

      newPayingMembers: mapMetric(row.overview.new_paying_members),

      expiringSoon: mapMetric(row.overview.expiring_soon),

      paidOnce: mapMetric(row.overview.paid_once),
    },

    financialSeries: Array.isArray(row.financial_series)
      ? row.financial_series.map((item) => ({
          bucketStart: item.bucket_start,
          grossCents: Number(item.gross_cents ?? 0),
          netCents: Number(item.net_cents ?? 0),

          platformFeeCents: Number(item.platform_fee_cents ?? 0),

          gatewayFeeCents: Number(item.gateway_fee_cents ?? 0),

          approvedPaymentCount: Number(item.approved_payment_count ?? 0),
        }))
      : [],

    paymentStatusDistribution,
    providerDistribution,
    memberSegments,
    userGrowthSeries,
    streetSummary,
  };
}

function getCacheKey(filters: AnalyticsDashboardFilters) {
  return JSON.stringify({
    period: filters.period,
    startDate: filters.startDate || null,
    endDate: filters.endDate || null,
    provider: filters.provider || null,
    status: filters.status || null,
    checkoutMode: filters.checkoutMode || null,
    street: filters.street || null,
    community: filters.community || null,
  });
}

export async function getAssociationAnalyticsDashboard(
  filters: AnalyticsDashboardFilters,
  options: {
    force?: boolean;
  } = {},
): Promise<AssociationAnalyticsDashboard> {
  const cacheKey = getCacheKey(filters);
  const currentTime = Date.now();

  if (!options.force) {
    const cached = dashboardCache.get(cacheKey);

    if (cached && cached.expiresAt > currentTime) {
      return cached.data;
    }

    const inFlight = inFlightRequests.get(cacheKey);

    if (inFlight) {
      return inFlight;
    }
  }

  const request = (async () => {
    const { data, error } = await supabase.rpc(
      "get_association_analytics_dashboard",
      {
        p_period: filters.period,

        p_start_date:
          filters.period === "custom" ? filters.startDate || null : null,

        p_end_date:
          filters.period === "custom" ? filters.endDate || null : null,

        p_provider: filters.provider || null,
        p_status: filters.status || null,

        p_checkout_mode: filters.checkoutMode || null,

        p_street: filters.street || null,

        p_community: filters.community || null,

        p_timezone: "America/Sao_Paulo",
      },
    );

    if (error) {
      throw new Error(
        error.message || "Não foi possível carregar os indicadores.",
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error("O dashboard retornou uma resposta inválida.");
    }

    const mapped = mapDashboard(data as unknown as DashboardRow);

    dashboardCache.set(cacheKey, {
      data: mapped,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return mapped;
  })();

  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    if (inFlightRequests.get(cacheKey) === request) {
      inFlightRequests.delete(cacheKey);
    }
  }
}

export function clearAssociationAnalyticsCache() {
  dashboardCache.clear();
}
