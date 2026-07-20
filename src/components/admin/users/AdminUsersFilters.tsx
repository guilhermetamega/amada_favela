import { useState } from "react";
import {
  CalendarDays,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { AdminUserListFilters } from "@/types/admin-users";

type AdminUsersFiltersProps = {
  filters: AdminUserListFilters;
  disabled?: boolean;
  onChange: (filters: AdminUserListFilters) => void;
  onClear: () => void;
};

export default function AdminUsersFilters({
  filters,
  disabled = false,
  onChange,
  onClear,
}: AdminUsersFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function updateFilters(values: Partial<AdminUserListFilters>) {
    onChange({
      ...filters,
      ...values,
      page: 1,
    });
  }

  const hasFilters = Boolean(
    filters.search ||
    filters.role ||
    filters.membershipStatus ||
    filters.street ||
    filters.createdFrom ||
    filters.createdTo,
  );

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_220px_auto]">
        <label className="relative">
          <span className="sr-only">Buscar usuários</span>

          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />

          <input
            type="search"
            value={filters.search}
            disabled={disabled}
            onChange={(event) =>
              updateFilters({
                search: event.target.value,
              })
            }
            placeholder="Nome, CPF, telefone, e-mail ou endereço"
            className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        <label>
          <span className="sr-only">Filtrar por função</span>

          <select
            value={filters.role}
            disabled={disabled}
            onChange={(event) =>
              updateFilters({
                role: event.target.value as AdminUserListFilters["role"],
              })
            }
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todas as funções</option>
            <option value="user">Usuários</option>
            <option value="employee">Funcionários</option>
            <option value="president">Presidentes</option>
            <option value="admin">Administradores</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Filtrar por associação</span>

          <select
            value={filters.membershipStatus}
            disabled={disabled}
            onChange={(event) =>
              updateFilters({
                membershipStatus: event.target
                  .value as AdminUserListFilters["membershipStatus"],
              })
            }
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todas as situações</option>
            <option value="active">Sócios ativos</option>
            <option value="expiring_soon">Próximos do vencimento</option>
            <option value="past_due">Inadimplentes</option>
            <option value="former_member">Ex-sócios</option>
            <option value="paid_once">Pagaram uma vez</option>
            <option value="never_paid">Nunca pagaram</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <SlidersHorizontal size={18} />
          Mais filtros
        </button>
      </div>

      {showAdvanced ? (
        <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_auto] dark:border-zinc-800">
          <label className="relative">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Rua
            </span>

            <Filter
              size={17}
              className="pointer-events-none absolute bottom-3.5 left-4 text-zinc-400"
            />

            <input
              type="text"
              value={filters.street}
              disabled={disabled}
              onChange={(event) =>
                updateFilters({
                  street: event.target.value,
                })
              }
              placeholder="Nome da rua"
              className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Cadastro inicial
            </span>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                type="date"
                value={filters.createdFrom}
                disabled={disabled}
                onChange={(event) =>
                  updateFilters({
                    createdFrom: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-3 text-sm text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Cadastro final
            </span>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                type="date"
                value={filters.createdTo}
                disabled={disabled}
                onChange={(event) =>
                  updateFilters({
                    createdTo: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-3 text-sm text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              disabled={!hasFilters || disabled}
              onClick={onClear}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <X size={17} />
              Limpar filtros
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
