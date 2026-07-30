type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
};

type AnalyticsChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  valueFormatter: (value: number) => string;
};

export default function AnalyticsChartTooltip({
  active,
  label,
  payload,
  valueFormatter,
}: AnalyticsChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-40 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      {label ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      ) : null}

      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div
            key={`${entry.name}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: entry.color,
                }}
              />

              {entry.name}
            </span>

            <strong className="text-sm text-zinc-900 dark:text-zinc-100">
              {valueFormatter(Number(entry.value ?? 0))}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
