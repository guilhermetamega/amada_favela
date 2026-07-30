export type AnalyticsPeriodPreset =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "current_month"
  | "current_year"
  | "all"
  | "custom";

export type AnalyticsProvider = "" | "stripe" | "mercadopago";

export type AnalyticsPaymentStatus =
  | ""
  | "succeeded"
  | "pending"
  | "processing"
  | "failed"
  | "cancelled"
  | "requires_action";

export type AnalyticsCheckoutMode = "" | "subscription" | "payment";

export type AnalyticsDashboardFilters = {
  period: AnalyticsPeriodPreset;
  startDate: string;
  endDate: string;
  provider: AnalyticsProvider;
  status: AnalyticsPaymentStatus;
  checkoutMode: AnalyticsCheckoutMode;
  street: string;
  community: string;
};

export type AnalyticsCommunityOption = {
  key: string;
  label: string;
};

export type AnalyticsMetricTrend = "up" | "down" | "flat" | "unavailable";

export type AnalyticsMetric = {
  current: number;
  previous: number | null;
  changePercentage: number | null;
  trend: AnalyticsMetricTrend;
  comparisonAvailable: boolean;
};

export type AnalyticsDashboardContext = {
  actorRole: "admin" | "president" | "employee";
  scopeCommunity: string | null;
  scopeLabel: string;
  isGlobalScope: boolean;
  availableCommunities: AnalyticsCommunityOption[];
};

export type AnalyticsDashboardPeriod = {
  preset: AnalyticsPeriodPreset;
  startDate: string;
  endDate: string;
  previousStartDate: string | null;
  previousEndDate: string | null;
  comparisonAvailable: boolean;
  granularity: "day" | "week" | "month" | "year";
  timezone: string;
};

export type AnalyticsOverview = {
  grossRevenueCents: AnalyticsMetric;
  associationNetCents: AnalyticsMetric;
  approvedPayments: AnalyticsMetric;
  averageTicketCents: AnalyticsMetric;
  activeMembers: AnalyticsMetric;
  newPayingMembers: AnalyticsMetric;
  expiringSoon: AnalyticsMetric;
  paidOnce: AnalyticsMetric;
};

export type AnalyticsFinancialSeriesItem = {
  bucketStart: string;
  grossCents: number;
  netCents: number;
  platformFeeCents: number;
  gatewayFeeCents: number;
  approvedPaymentCount: number;
};

export type AnalyticsPaymentStatusItem = {
  status: string;
  paymentCount: number;
  amountCents: number;
};

export type AnalyticsProviderItem = {
  provider: string;
  paymentCount: number;
  approvedPaymentCount: number;
  grossCents: number;
  netCents: number;
  averageTicketCents: number;
  approvalRate: number;
};

export type AnalyticsMemberSegmentItem = {
  segment: string;
  total: number;
};

export type AnalyticsUserGrowthItem = {
  bucketStart: string;
  registeredUsers: number;
  newPayingUsers: number;
};

export type AnalyticsStreetSummaryItem = {
  street: string;
  registeredUsers: number;
  payingUsers: number;
  activeMembers: number;
  grossCents: number;
  conversionRate: number;
};

export type AssociationAnalyticsDashboard = {
  generatedAt: string;
  context: AnalyticsDashboardContext;
  period: AnalyticsDashboardPeriod;
  availableStreets: string[];
  overview: AnalyticsOverview;
  financialSeries: AnalyticsFinancialSeriesItem[];
  paymentStatusDistribution: AnalyticsPaymentStatusItem[];
  providerDistribution: AnalyticsProviderItem[];
  memberSegments: AnalyticsMemberSegmentItem[];
  userGrowthSeries: AnalyticsUserGrowthItem[];
  streetSummary: AnalyticsStreetSummaryItem[];
};
