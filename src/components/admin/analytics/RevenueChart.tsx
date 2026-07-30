import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnalyticsChartCard from "./AnalyticsChartCard";
import AnalyticsChartTooltip from "./AnalyticsChartTooltip";
import type {
  AnalyticsDashboardPeriod,
  AnalyticsFinancialSeriesItem,
} from "@/types/admin-analytics";
import {
  formatAnalyticsBucketLabel,
  formatCompactCurrencyFromCents,
} from "@/lib/admin-analytics";
import { formatCurrencyFromCents } from "@/utils/formatters";

type RevenueChartProps = {
  data: AnalyticsFinancialSeriesItem[];
  period: AnalyticsDashboardPeriod;
};

export default function RevenueChart({ data, period }: RevenueChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,

        label: formatAnalyticsBucketLabel(item.bucketStart, period.granularity),
      })),
    [data, period.granularity],
  );

  return (
    <AnalyticsChartCard
      title="Arrecadação por período"
      description="Valores aprovados brutos e líquidos destinados à associação."
    >
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold">
        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 dark:bg-cyan-400" />
          Arrecadação bruta
        </span>

        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Líquido da associação
        </span>
      </div>

      <div className="h-72 w-full sm:h-80 [--chart-axis:#71717a] [--chart-grid:#e4e4e7] [--chart-gross:#0891b2] [--chart-net:#059669] dark:[--chart-axis:#a1a1aa] dark:[--chart-grid:#3f3f46] dark:[--chart-gross:#22d3ee] dark:[--chart-net:#34d399]">
        <ResponsiveContainer width="100%" height="100%" debounce={120}>
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 8,
              left: -14,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="grossRevenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--chart-gross)"
                  stopOpacity={0.28}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-gross)"
                  stopOpacity={0}
                />
              </linearGradient>

              <linearGradient
                id="netRevenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--chart-net)"
                  stopOpacity={0.24}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-net)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              tick={{
                fill: "var(--chart-axis)",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />

            <YAxis
              stroke="var(--chart-axis)"
              tick={{
                fill: "var(--chart-axis)",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCompactCurrencyFromCents}
              width={72}
            />

            <Tooltip
              content={
                <AnalyticsChartTooltip
                  valueFormatter={formatCurrencyFromCents}
                />
              }
            />

            <Area
              type="monotone"
              dataKey="grossCents"
              name="Bruto"
              stroke="var(--chart-gross)"
              fill="url(#grossRevenueGradient)"
              strokeWidth={3}
              activeDot={{
                r: 5,
              }}
            />

            <Area
              type="monotone"
              dataKey="netCents"
              name="Líquido"
              stroke="var(--chart-net)"
              fill="url(#netRevenueGradient)"
              strokeWidth={3}
              activeDot={{
                r: 5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsChartCard>
  );
}
