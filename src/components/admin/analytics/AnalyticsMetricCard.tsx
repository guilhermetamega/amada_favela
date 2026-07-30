import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { AnalyticsMetric } from "@/types/admin-analytics";
import {
  formatAnalyticsInteger,
  formatMetricChange,
} from "@/lib/admin-analytics";
import { formatCurrencyFromCents } from "@/utils/formatters";

type MetricTone = "cyan" | "emerald" | "violet" | "amber";

type AnalyticsMetricCardProps = {
  label: string;
  description: string;
  metric: AnalyticsMetric;
  icon: LucideIcon;
  format: "currency" | "number";
  tone: MetricTone;
};

const toneStyles: Record<
  MetricTone,
  {
    icon: string;
    surface: string;
  }
> = {
  cyan: {
    icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
    surface: "from-cyan-50/70 dark:from-cyan-950/20",
  },

  emerald: {
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    surface: "from-emerald-50/70 dark:from-emerald-950/20",
  },

  violet: {
    icon: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    surface: "from-violet-50/70 dark:from-violet-950/20",
  },

  amber: {
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    surface: "from-amber-50/70 dark:from-amber-950/20",
  },
};

export default function AnalyticsMetricCard({
  label,
  description,
  metric,
  icon: Icon,
  format,
  tone,
}: AnalyticsMetricCardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrencyFromCents(metric.current)
      : formatAnalyticsInteger(metric.current);

  const changeLabel = formatMetricChange(metric);

  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : ArrowRight;

  const trendStyle =
    metric.trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : metric.trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-zinc-500 dark:text-zinc-400";

  return (
    <article
      className={[
        "overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br to-white p-4 shadow-sm dark:border-zinc-800 dark:to-zinc-900",
        toneStyles[tone].surface,
      ].join(" ")}
    >
      <div className="flex-col items-center justify-center gap-3">
        <div
          className={[
            "flex h-11 w-full shrink-0 items-center justify-center rounded-2xl mb-3",
            toneStyles[tone].icon,
          ].join(" ")}
        >
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {label}
          </p>

          <p className="mt-3 wrap-break-word text-xl font-black tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
            {formattedValue}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={[
            "inline-flex items-center gap-1 text-xs font-bold",
            trendStyle,
          ].join(" ")}
        >
          <TrendIcon size={15} />
          {changeLabel}
        </span>

        {metric.comparisonAvailable ? (
          <span className="text-xs text-zinc-400">vs. período anterior</span>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </article>
  );
}
