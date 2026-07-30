import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnalyticsChartCard from "./AnalyticsChartCard";
import AnalyticsChartTooltip from "./AnalyticsChartTooltip";
import type {
  AnalyticsDashboardPeriod,
  AnalyticsUserGrowthItem,
} from "@/types/admin-analytics";
import {
  formatAnalyticsBucketLabel,
  formatAnalyticsInteger,
} from "@/lib/admin-analytics";

type UserGrowthChartProps = {
  data: AnalyticsUserGrowthItem[];
  period: AnalyticsDashboardPeriod;
};

export default function UserGrowthChart({
  data,
  period,
}: UserGrowthChartProps) {
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
      title="Cadastros e novos pagantes"
      description="Comparação entre novos usuários e primeiros pagamentos aprovados."
    >
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold">
        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-600 dark:bg-violet-400" />
          Cadastros
        </span>

        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 dark:bg-cyan-400" />
          Novos pagantes
        </span>
      </div>

      <div className="h-72 w-full [--chart-axis:#71717a] [--chart-grid:#e4e4e7] [--chart-users:#7c3aed] [--chart-payers:#0891b2] dark:[--chart-axis:#a1a1aa] dark:[--chart-grid:#3f3f46] dark:[--chart-users:#a78bfa] dark:[--chart-payers:#22d3ee]">
        <ResponsiveContainer width="100%" height="100%" debounce={120}>
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 8,
              left: -18,
              bottom: 0,
            }}
          >
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
              allowDecimals={false}
            />

            <Tooltip
              content={
                <AnalyticsChartTooltip
                  valueFormatter={formatAnalyticsInteger}
                />
              }
            />

            <Line
              type="monotone"
              dataKey="registeredUsers"
              name="Cadastros"
              stroke="var(--chart-users)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
              }}
            />

            <Line
              type="monotone"
              dataKey="newPayingUsers"
              name="Novos pagantes"
              stroke="var(--chart-payers)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsChartCard>
  );
}
