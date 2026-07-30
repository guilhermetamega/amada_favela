import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { MousePointerClick, RotateCcw, Users } from "lucide-react";
import AnalyticsChartCard from "./AnalyticsChartCard";
import AnalyticsChartTooltip from "./AnalyticsChartTooltip";
import type { AnalyticsMemberSegmentItem } from "@/types/admin-analytics";
import type { AnalyticsMemberSegment } from "@/types/admin-analytics-segments";
import {
  formatAnalyticsInteger,
  formatAnalyticsPercentage,
  MEMBER_SEGMENT_LABELS,
} from "@/lib/admin-analytics";

type MembershipDistributionChartProps = {
  data: AnalyticsMemberSegmentItem[];

  interactive?: boolean;

  onSegmentClick?: (segment: AnalyticsMemberSegment) => void;
};

type ChartItem = AnalyticsMemberSegmentItem & {
  segment: AnalyticsMemberSegment;

  label: string;
};

const segmentColors: Record<AnalyticsMemberSegment, string> = {
  active: "var(--segment-active)",

  expiring_soon: "var(--segment-expiring)",

  past_due: "var(--segment-past-due)",

  former_member: "var(--segment-former)",

  paid_once: "var(--segment-once)",

  never_paid: "var(--segment-never)",
};

function isAnalyticsMemberSegment(
  value: string,
): value is AnalyticsMemberSegment {
  return [
    "active",
    "expiring_soon",
    "past_due",
    "former_member",
    "paid_once",
    "never_paid",
  ].includes(value);
}

export default function MembershipDistributionChart({
  data,
  interactive = false,
  onSegmentClick,
}: MembershipDistributionChartProps) {
  const chartData = useMemo<ChartItem[]>(
    () =>
      data
        .filter(
          (
            item,
          ): item is AnalyticsMemberSegmentItem & {
            segment: AnalyticsMemberSegment;
          } => isAnalyticsMemberSegment(item.segment),
        )
        .map((item) => ({
          ...item,

          label: MEMBER_SEGMENT_LABELS[item.segment] ?? item.segment,
        })),
    [data],
  );

  const total = chartData.reduce((sum, item) => sum + item.total, 0);

  const neverPaid =
    chartData.find((item) => item.segment === "never_paid")?.total ?? 0;

  const formerMembers =
    chartData.find((item) => item.segment === "former_member")?.total ?? 0;

  const paidOnce =
    chartData.find((item) => item.segment === "paid_once")?.total ?? 0;

  const usersWhoAlreadyPaid = Math.max(total - neverPaid, 0);

  const reactivationBase = formerMembers + paidOnce;

  const reactivationPotential =
    usersWhoAlreadyPaid > 0
      ? (reactivationBase / usersWhoAlreadyPaid) * 100
      : 0;

  function openSegment(segment: AnalyticsMemberSegment) {
    if (!interactive || !onSegmentClick) {
      return;
    }

    onSegmentClick(segment);
  }

  function handlePieClick(entry: unknown) {
    if (typeof entry !== "object" || entry === null) {
      return;
    }

    const record = entry as Record<string, unknown>;

    const directSegment = record.segment;

    const payload =
      typeof record.payload === "object" && record.payload !== null
        ? (record.payload as Record<string, unknown>)
        : null;

    const value =
      typeof directSegment === "string"
        ? directSegment
        : typeof payload?.segment === "string"
          ? payload.segment
          : null;

    if (value && isAnalyticsMemberSegment(value)) {
      openSegment(value);
    }
  }

  return (
    <AnalyticsChartCard
      title="Distribuição dos usuários"
      description="Situação atual dos usuários em relação à associação."
      action={
        interactive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
            <MousePointerClick size={14} />
            Gráfico interativo
          </span>
        ) : undefined
      }
    >
      <div className="[--segment-active:#059669] [--segment-expiring:#d97706] [--segment-past-due:#dc2626] [--segment-former:#71717a] [--segment-once:#0284c7] [--segment-never:#7c3aed] dark:[--segment-active:#34d399] dark:[--segment-expiring:#fbbf24] dark:[--segment-past-due:#f87171] dark:[--segment-former:#a1a1aa] dark:[--segment-once:#38bdf8] dark:[--segment-never:#a78bfa]">
        <section className="mb-4 grid grid-cols-2 gap-3">
          <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-500/20 dark:bg-cyan-500/10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                  Base reativável
                </p>

                <p className="mt-2 text-2xl font-black text-cyan-900 dark:text-cyan-100">
                  {formatAnalyticsInteger(reactivationBase)}
                </p>
              </div>

              <RotateCcw
                size={20}
                className="text-cyan-600 dark:text-cyan-400"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-cyan-800/80 dark:text-cyan-200/70">
              Ex-sócios e usuários que pagaram somente uma vez.
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Potencial
                </p>

                <p className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-100">
                  {formatAnalyticsPercentage(reactivationPotential)}
                </p>
              </div>

              <Users
                size={20}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-emerald-800/80 dark:text-emerald-200/70">
              Percentual da base que já pagou e pode ser reativada.
            </p>
          </article>
        </section>

        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" debounce={120}>
            <PieChart>
              <Tooltip
                content={
                  <AnalyticsChartTooltip
                    valueFormatter={formatAnalyticsInteger}
                  />
                }
              />

              <Pie
                data={chartData}
                dataKey="total"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="82%"
                paddingAngle={3}
                stroke="transparent"
                onClick={handlePieClick}
                style={{
                  cursor: interactive ? "pointer" : "default",
                }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.segment}
                    fill={segmentColors[entry.segment]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {formatAnalyticsInteger(total)}
            </span>

            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              usuários
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {chartData.map((item) => {
            const content = (
              <>
                <span className="flex min-w-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: segmentColors[item.segment],
                    }}
                  />

                  <span className="truncate">{item.label}</span>
                </span>

                <span className="flex items-center gap-2">
                  <strong className="text-sm text-zinc-900 dark:text-zinc-100">
                    {formatAnalyticsInteger(item.total)}
                  </strong>

                  {interactive ? (
                    <MousePointerClick size={14} className="text-zinc-400" />
                  ) : null}
                </span>
              </>
            );

            if (!interactive) {
              return (
                <div
                  key={item.segment}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/60"
                >
                  {content}
                </div>
              );
            }

            return (
              <button
                key={item.segment}
                type="button"
                onClick={() => openSegment(item.segment)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent bg-zinc-50 px-3 py-2.5 text-left transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 dark:bg-zinc-950/60 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                aria-label={`Ver usuários do segmento ${item.label}`}
              >
                {content}
              </button>
            );
          })}
        </div>

        {interactive ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
            <MousePointerClick size={14} />
            Clique em uma fatia ou categoria para consultar os contatos.
          </p>
        ) : null}
      </div>
    </AnalyticsChartCard>
  );
}
