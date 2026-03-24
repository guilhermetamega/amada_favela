import { Sparkles } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
};

export default function DashboardWelcome({ title, subtitle }: Props) {
  return (
    <section className="mb-5">
      <div className="flex items-start gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
