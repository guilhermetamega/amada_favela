import { CalendarDays, Filter, RotateCcw, Search } from "lucide-react";
import { ANALYTICS_PERIOD_OPTIONS } from "@/lib/admin-analytics";
import type {
  AnalyticsDashboardContext,
  AnalyticsDashboardFilters,
  AnalyticsPeriodPreset,
} from "@/types/admin-analytics";

type AnalyticsFiltersProps = {
  filters: AnalyticsDashboardFilters;
  context: AnalyticsDashboardContext | null;
  availableStreets: string[];
  loading: boolean;

  onChange: (filters: AnalyticsDashboardFilters) => void;

  onApply: () => void;
  onReset: () => void;
};

export default function AnalyticsFilters({
  filters,
  context,
  availableStreets,
  loading,
  onChange,
  onApply,
  onReset,
}: AnalyticsFiltersProps) {
  function updateFilters(changes: Partial<AnalyticsDashboardFilters>) {
    onChange({
      ...filters,
      ...changes,
    });
  }

  const customPeriodInvalid =
    filters.period === "custom" &&
    (!filters.startDate ||
      !filters.endDate ||
      filters.startDate > filters.endDate);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
          <Filter size={19} />
        </div>

        <div>
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
            Filtros do dashboard
          </h2>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            As alterações só consultam o banco ao clicar em Aplicar filtros.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Período
          </span>

          <select
            value={filters.period}
            disabled={loading}
            onChange={(event) =>
              updateFilters({
                period: event.target.value as AnalyticsPeriodPreset,
              })
            }
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {ANALYTICS_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Gateway
          </span>

          <select
            value={filters.provider}
            disabled={loading}
            onChange={(event) =>
              updateFilters({
                provider: event.target
                  .value as AnalyticsDashboardFilters["provider"],
              })
            }
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todos os gateways</option>
            <option value="stripe">Stripe</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Status
          </span>

          <select
            value={filters.status}
            disabled={loading}
            onChange={(event) =>
              updateFilters({
                status: event.target
                  .value as AnalyticsDashboardFilters["status"],
              })
            }
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todos os status</option>
            <option value="succeeded">Aprovados</option>
            <option value="pending">Pendentes</option>
            <option value="processing">Processando</option>
            <option value="failed">Falhos</option>
            <option value="cancelled">Cancelados</option>
            <option value="requires_action">Requer ação</option>
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Tipo de cobrança
          </span>

          <select
            value={filters.checkoutMode}
            disabled={loading}
            onChange={(event) =>
              updateFilters({
                checkoutMode: event.target
                  .value as AnalyticsDashboardFilters["checkoutMode"],
              })
            }
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todas as cobranças</option>
            <option value="subscription">Recorrente</option>
            <option value="payment">Avulsa</option>
          </select>
        </label>

        {context?.actorRole === "admin" ? (
          <label>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Comunidade
            </span>

            <select
              value={filters.community}
              disabled={loading}
              onChange={(event) =>
                updateFilters({
                  community: event.target.value,
                  street: "",
                })
              }
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Todas as comunidades</option>

              {context.availableCommunities.map((community) => (
                <option key={community.key} value={community.key}>
                  {community.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Rua
          </span>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <select
              value={filters.street}
              disabled={loading}
              onChange={(event) =>
                updateFilters({
                  street: event.target.value,
                })
              }
              className="w-full appearance-none rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Todas as ruas</option>

              {availableStreets.map((street) => (
                <option key={street} value={street}>
                  {street}
                </option>
              ))}
            </select>
          </div>
        </label>

        {filters.period === "custom" ? (
          <>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Data inicial
              </span>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  type="date"
                  value={filters.startDate}
                  disabled={loading}
                  onChange={(event) =>
                    updateFilters({
                      startDate: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-3 text-sm text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Data final
              </span>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  type="date"
                  value={filters.endDate}
                  disabled={loading}
                  onChange={(event) =>
                    updateFilters({
                      endDate: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-3 text-sm text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </label>
          </>
        ) : null}
      </div>

      {customPeriodInvalid ? (
        <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          Informe um período personalizado válido.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <RotateCcw size={17} />
          Redefinir
        </button>

        <button
          type="button"
          disabled={loading || customPeriodInvalid}
          onClick={onApply}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Filter size={17} />
          Aplicar filtros
        </button>
      </div>
    </section>
  );
}
