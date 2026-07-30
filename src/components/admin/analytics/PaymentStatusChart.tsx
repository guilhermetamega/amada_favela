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
import type { AnalyticsPaymentStatusItem } from "@/types/admin-analytics";
import {
  formatAnalyticsInteger,
  PAYMENT_STATUS_LABELS,
} from "@/lib/admin-analytics";

type PaymentStatusChartProps = {
  data: AnalyticsPaymentStatusItem[];
};

export default function PaymentStatusChart({ data }: PaymentStatusChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        label: PAYMENT_STATUS_LABELS[item.status] ?? item.status,
      })),
    [data],
  );

  return (
    <AnalyticsChartCard
      title="Pagamentos por status"
      description="Quantidade de cobranças identificadas em cada situação."
    >
      <div className="h-72 w-full [--chart-axis:#71717a] [--chart-grid:#e4e4e7] [--chart-bar:#7c3aed] dark:[--chart-axis:#a1a1aa] dark:[--chart-grid:#3f3f46] dark:[--chart-bar:#a78bfa]">
        <ResponsiveContainer width="100%" height="100%" debounce={120}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 4,
              right: 16,
              left: 8,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="4 4"
              horizontal={false}
            />

            <XAxis
              type="number"
              stroke="var(--chart-axis)"
              tick={{
                fill: "var(--chart-axis)",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <YAxis
              type="category"
              dataKey="label"
              width={112}
              stroke="var(--chart-axis)"
              tick={{
                fill: "var(--chart-axis)",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={
                <AnalyticsChartTooltip
                  valueFormatter={formatAnalyticsInteger}
                />
              }
            />

            <Bar
              dataKey="paymentCount"
              name="Pagamentos"
              fill="var(--chart-bar)"
              radius={[0, 8, 8, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsChartCard>
  );
}
