import { MapPin, Users, WalletCards } from "lucide-react";
import AnalyticsChartCard from "./AnalyticsChartCard";
import type { AnalyticsStreetSummaryItem } from "@/types/admin-analytics";
import {
  formatAnalyticsInteger,
  formatAnalyticsPercentage,
} from "@/lib/admin-analytics";
import { formatCurrencyFromCents } from "@/utils/formatters";

type StreetSummaryProps = {
  data: AnalyticsStreetSummaryItem[];
};

export default function StreetSummary({ data }: StreetSummaryProps) {
  return (
    <AnalyticsChartCard
      title="Desempenho por rua"
      description="Cadastros, pagantes, sócios ativos, conversão e arrecadação."
    >
      {data.length === 0 ? (
        <div className="py-12 text-center">
          <MapPin className="mx-auto text-zinc-400" />

          <p className="mt-3 font-semibold text-zinc-700 dark:text-zinc-300">
            Nenhuma rua encontrada
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-190">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Rua
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Cadastros
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Pagantes
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Sócios
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Conversão
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Arrecadado
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((street) => (
                  <tr
                    key={street.street}
                    className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/70"
                  >
                    <td className="px-3 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {street.street}
                    </td>

                    <td className="px-3 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300">
                      {formatAnalyticsInteger(street.registeredUsers)}
                    </td>

                    <td className="px-3 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300">
                      {formatAnalyticsInteger(street.payingUsers)}
                    </td>

                    <td className="px-3 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300">
                      {formatAnalyticsInteger(street.activeMembers)}
                    </td>

                    <td className="px-3 py-4 text-right text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                      {formatAnalyticsPercentage(street.conversionRate)}
                    </td>

                    <td className="px-3 py-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrencyFromCents(street.grossCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {data.map((street) => (
              <article
                key={street.street}
                className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
                    />

                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                      {street.street}
                    </h3>
                  </div>

                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                    {formatAnalyticsPercentage(street.conversionRate)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/60">
                    <Users
                      size={17}
                      className="text-violet-600 dark:text-violet-400"
                    />

                    <p className="mt-2 text-xs text-zinc-500">
                      Cadastros / pagantes
                    </p>

                    <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                      {street.registeredUsers} / {street.payingUsers}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/60">
                    <WalletCards
                      size={17}
                      className="text-emerald-600 dark:text-emerald-400"
                    />

                    <p className="mt-2 text-xs text-zinc-500">Arrecadação</p>

                    <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrencyFromCents(street.grossCents)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </AnalyticsChartCard>
  );
}
