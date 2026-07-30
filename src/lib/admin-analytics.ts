import type {
  AnalyticsDashboardFilters,
  AnalyticsMetric,
  AnalyticsPeriodPreset,
} from "@/types/admin-analytics";

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsDashboardFilters = {
  period: "current_month",
  startDate: "",
  endDate: "",
  provider: "",
  status: "",
  checkoutMode: "",
  street: "",
  community: "",
};

export const ANALYTICS_PERIOD_OPTIONS: Array<{
  value: AnalyticsPeriodPreset;
  label: string;
}> = [
  {
    value: "today",
    label: "Hoje",
  },
  {
    value: "last_7_days",
    label: "Últimos 7 dias",
  },
  {
    value: "last_30_days",
    label: "Últimos 30 dias",
  },
  {
    value: "current_month",
    label: "Mês atual",
  },
  {
    value: "current_year",
    label: "Ano atual",
  },
  {
    value: "all",
    label: "Todo o período",
  },
  {
    value: "custom",
    label: "Personalizado",
  },
];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  succeeded: "Aprovados",
  pending: "Pendentes",
  processing: "Processando",
  failed: "Falhos",
  cancelled: "Cancelados",
  requires_action: "Requer ação",
};

export const PROVIDER_LABELS: Record<string, string> = {
  stripe: "Stripe",
  mercadopago: "Mercado Pago",
};

export const MEMBER_SEGMENT_LABELS: Record<string, string> = {
  active: "Sócios ativos",
  expiring_soon: "Próximos do vencimento",
  past_due: "Inadimplentes",
  former_member: "Ex-sócios",
  paid_once: "Pagaram uma vez",
  never_paid: "Nunca pagaram",
};

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatCompactCurrencyFromCents(value: number) {
  return compactCurrencyFormatter.format(Number(value ?? 0) / 100);
}

export function formatAnalyticsInteger(value: number) {
  return integerFormatter.format(Number(value ?? 0));
}

export function formatAnalyticsPercentage(value: number) {
  return `${percentageFormatter.format(Number(value ?? 0))}%`;
}

export function formatMetricChange(metric: AnalyticsMetric) {
  if (!metric.comparisonAvailable) {
    return "Sem comparação";
  }

  if (
    metric.changePercentage === null &&
    metric.current > 0 &&
    Number(metric.previous ?? 0) === 0
  ) {
    return "Novo no período";
  }

  if (metric.changePercentage === null) {
    return "Sem base anterior";
  }

  const absoluteValue = Math.abs(metric.changePercentage);
  const prefix =
    metric.changePercentage > 0 ? "+" : metric.changePercentage < 0 ? "-" : "";

  return `${prefix}${percentageFormatter.format(absoluteValue)}%`;
}

export function formatAnalyticsBucketLabel(
  value: string,
  granularity: "day" | "week" | "month" | "year",
) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (granularity === "year") {
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
    }).format(date);
  }

  if (granularity === "month") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatAnalyticsPeriod(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(start)} a ${formatter.format(end)}`;
}
