import type { ReactNode } from "react";

type AnalyticsChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
};

export default function AnalyticsChartCard({
  title,
  description,
  children,
  action,
}: AnalyticsChartCardProps) {
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 dark:border-zinc-800">
        <div>
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>

        {action}
      </header>

      <div className="p-3 sm:p-5">{children}</div>
    </article>
  );
}
