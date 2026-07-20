import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Clock3,
  RefreshCw,
  Users,
  WalletCards,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import AdminUsersFilters from "@/components/admin/users/AdminUsersFilters";
import AdminUsersList from "@/components/admin/users/AdminUsersList";
import AdminUsersPagination from "@/components/admin/users/AdminUsersPagination";
import AdminUserPreviewDrawer from "@/components/admin/users/AdminUserPreviewDrawer";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { listAdminUsers } from "@/services/supabase/admin-users";
import type {
  AdminUserListFilters,
  AdminUserListItem,
  AdminUserListResponse,
} from "@/types/admin-users";
import { formatCurrencyFromCents } from "@/utils/formatters";

const DEFAULT_FILTERS: AdminUserListFilters = {
  search: "",
  role: "",
  membershipStatus: "",
  street: "",
  createdFrom: "",
  createdTo: "",
  page: 1,
  pageSize: 12,
};

type SummaryCardProps = {
  label: string;
  value: string;
  icon: typeof Users;
  description: string;
};

type LoadUsersOptions = {
  force?: boolean;
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  description,
}: SummaryCardProps) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">{description}</p>
    </article>
  );
}

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUserListFilters>(DEFAULT_FILTERS);

  const [response, setResponse] = useState<AdminUserListResponse | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const inFlightRequestRef = useRef<{
    key: string;
    requestId: number;
  } | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 400);

  const {
    role,
    membershipStatus,
    street,
    createdFrom,
    createdTo,
    page,
    pageSize,
  } = filters;

  const loadUsers = useCallback(
    async (options: LoadUsersOptions = {}) => {
      const requestFilters: AdminUserListFilters = {
        search: debouncedSearch,
        role,
        membershipStatus,
        street,
        createdFrom,
        createdTo,
        page,
        pageSize,
      };

      const requestKey = JSON.stringify(requestFilters);

      const duplicatedRequest = inFlightRequestRef.current?.key === requestKey;

      if (duplicatedRequest && !options.force) {
        return;
      }

      const requestId = ++requestIdRef.current;

      inFlightRequestRef.current = {
        key: requestKey,
        requestId,
      };

      try {
        if (hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const data = await listAdminUsers(requestFilters);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResponse(data);
        hasLoadedRef.current = true;
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os usuários.",
        );
      } finally {
        if (inFlightRequestRef.current?.requestId === requestId) {
          inFlightRequestRef.current = null;
        }

        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      debouncedSearch,
      role,
      membershipStatus,
      street,
      createdFrom,
      createdTo,
      page,
      pageSize,
    ],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function handleFiltersChange(nextFilters: AdminUserListFilters) {
    setFilters(nextFilters);
  }

  function handleClearFilters() {
    setFilters({
      ...DEFAULT_FILTERS,
    });
  }

  function handlePageChange(nextPage: number) {
    if (nextPage === filters.page) {
      return;
    }

    setFilters((current) => ({
      ...current,
      page: nextPage,
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleManualRefresh() {
    void loadUsers({
      force: true,
    });
  }

  const summary = response?.summary;

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex w-full justify-between items-center">
            <DashboardHeader title="Central de Usuários" />
            <button
              type="button"
              disabled={loading || refreshing}
              onClick={handleManualRefresh}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Atualizar
            </button>
          </div>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard
              label="Resultados"
              value={String(summary?.totalUsers ?? 0)}
              icon={Users}
              description="Usuários encontrados com os filtros atuais."
            />

            <SummaryCard
              label="Sócios ativos"
              value={String(summary?.activeMembers ?? 0)}
              icon={BadgeCheck}
              description="Inclui vínculos ativos próximos do vencimento."
            />

            <SummaryCard
              label="Próximos do vencimento"
              value={String(summary?.expiringSoon ?? 0)}
              icon={Clock3}
              description="Vínculos que vencem nos próximos sete dias."
            />

            <SummaryCard
              label="Total contribuído"
              value={formatCurrencyFromCents(
                summary?.totalContributedCents ?? 0,
              )}
              icon={WalletCards}
              description="Somatório dos pagamentos aprovados encontrados."
            />
          </section>

          <AdminUsersFilters
            filters={filters}
            disabled={loading}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
          />

          {errorMessage ? (
            <div
              role="alert"
              className="flex flex-col items-start justify-between gap-3 rounded-3xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center dark:border-red-500/20 dark:bg-red-500/10"
            >
              <p className="text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={handleManualRefresh}
                className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          <AdminUsersList
            users={response?.items ?? []}
            loading={loading}
            refreshing={refreshing}
            onOpenUser={setSelectedUser}
          />

          <AdminUsersPagination
            page={response?.page ?? 1}
            totalPages={response?.totalPages ?? 0}
            totalCount={response?.totalCount ?? 0}
            disabled={refreshing}
            onPageChange={handlePageChange}
          />
        </div>

        <AdminUserPreviewDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      </MainLayout>
    </DashboardLayout>
  );
}
