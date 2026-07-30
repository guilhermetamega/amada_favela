import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnalyticsChartCard from "./AnalyticsChartCard";
import AnalyticsChartTooltip from "./AnalyticsChartTooltip";
import type { AnalyticsProviderItem } from "@/types/admin-analytics";
import {
  formatCompactCurrencyFromCents,
  PROVIDER_LABELS,
} from "@/lib/admin-analytics";
import { formatCurrencyFromCents } from "@/utils/formatters";

type ProviderDistributionChartProps = {
  data: AnalyticsProviderItem[];
};

export default function ProviderDistributionChart({
  data,
}: ProviderDistributionChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,

        label: PROVIDER_LABELS[item.provider] ?? item.provider,
      })),
    [data],
  );

  return (
    <AnalyticsChartCard
      title="Receita por gateway"
      description="Comparação entre valor bruto e líquido por provedor."
    >
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold">
        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-600 dark:bg-sky-400" />
          Bruto
        </span>

        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Líquido
        </span>
      </div>

      <div className="h-72 w-full [--chart-axis:#71717a] [--chart-grid:#e4e4e7] [--chart-gross:#0284c7] [--chart-net:#059669] dark:[--chart-axis:#a1a1aa] dark:[--chart-grid:#3f3f46] dark:[--chart-gross:#38bdf8] dark:[--chart-net:#34d399]">
        <ResponsiveContainer width="100%" height="100%" debounce={120}>
          <BarChart
            data={chartData}
            margin={{
              top: 6,
              right: 8,
              left: -10,
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
            />

            <YAxis
              stroke="var(--chart-axis)"
              tick={{
                fill: "var(--chart-axis)",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              width={72}
              tickFormatter={formatCompactCurrencyFromCents}
            />

            <Tooltip
              content={
                <AnalyticsChartTooltip
                  valueFormatter={formatCurrencyFromCents}
                />
              }
            />

            <Bar
              dataKey="grossCents"
              name="Bruto"
              fill="var(--chart-gross)"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            />

            <Bar
              dataKey="netCents"
              name="Líquido"
              fill="var(--chart-net)"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {data.map((provider) => (
          <div
            key={provider.provider}
            className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/60"
          >
            <p className="font-bold text-zinc-900 dark:text-zinc-100">
              {PROVIDER_LABELS[provider.provider] ?? provider.provider}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-500">Aprovação</p>

                <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  {provider.approvalRate.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">Ticket médio</p>

                <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatCurrencyFromCents(provider.averageTicketCents)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AnalyticsChartCard>
  );
}
