import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { MEMBER_SEGMENT_LABELS } from "@/lib/admin-analytics";
import { listAnalyticsSegmentUsers } from "@/services/supabase/admin-analytics-segments";
import type { AnalyticsDashboardFilters } from "@/types/admin-analytics";
import type {
  AnalyticsMemberSegment,
  AnalyticsSegmentUsersResponse,
} from "@/types/admin-analytics-segments";
import {
  formatCurrencyFromCents,
  formatDate,
  formatPhone,
} from "@/utils/formatters";

type AnalyticsSegmentUsersDialogProps = {
  isOpen: boolean;

  segment: AnalyticsMemberSegment | null;

  filters: AnalyticsDashboardFilters;

  scopeLabel: string;

  onClose: () => void;
};

function getAddress(address1: string, addressNumber: string | null) {
  return [address1, addressNumber].filter(Boolean).join(", ");
}

function getWhatsAppUrl(phoneDigits: string) {
  const normalized = phoneDigits.startsWith("55")
    ? phoneDigits
    : `55${phoneDigits}`;

  return `https://wa.me/${normalized}`;
}

function LoadingList() {
  return (
    <div className="space-y-3 p-4 sm:p-5">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}

export default function AnalyticsSegmentUsersDialog({
  isOpen,
  segment,
  filters,
  scopeLabel,
  onClose,
}: AnalyticsSegmentUsersDialogProps) {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [response, setResponse] =
    useState<AnalyticsSegmentUsersResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const requestIdRef = useRef(0);

  const hasLoadedRef = useRef(false);

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    if (!isOpen || !segment) {
      return;
    }

    setSearch("");
    setPage(1);
    setResponse(null);
    setErrorMessage("");

    hasLoadedRef.current = false;
  }, [isOpen, segment]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !segment) {
      return;
    }

    const requestId = ++requestIdRef.current;

    async function loadUsers() {
      try {
        if (hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const data = await listAnalyticsSegmentUsers({
          segment: segment!,

          search: debouncedSearch,

          page,
          pageSize: 12,

          community: filters.community,

          street: filters.street,
        });

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
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadUsers();
  }, [
    debouncedSearch,
    filters.community,
    filters.street,
    isOpen,
    page,
    segment,
  ]);

  if (!isOpen || !segment) {
    return null;
  }

  const segmentLabel = MEMBER_SEGMENT_LABELS[segment] ?? segment;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openUserProfile(userId: string) {
    onClose();

    navigate(`/admin/users/${userId}`);
  }

  function forceRefresh() {
    if (!segment) {
      return;
    }

    const requestId = ++requestIdRef.current;

    async function refresh() {
      try {
        setRefreshing(true);
        setErrorMessage("");

        const data = await listAnalyticsSegmentUsers(
          {
            segment: segment!,

            search: debouncedSearch,

            page,
            pageSize: 12,

            community: filters.community,

            street: filters.street,
          },
          {
            force: true,
          },
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResponse(data);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar os usuários.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setRefreshing(false);
        }
      }
    }

    void refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-segment-title"
        className="flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-5xl sm:rounded-3xl dark:bg-zinc-950"
      >
        <header className="border-b border-zinc-200 p-4 sm:p-5 dark:border-zinc-800">
          <div className="flex items-center justify-center gap-4">
            <div className="flex justify-center items-center flex-1 flex-col">
              <h2
                id="analytics-segment-title"
                className="mt-1 text-xl font-black text-zinc-900 sm:text-2xl dark:text-zinc-100"
              >
                {segmentLabel}
              </h2>

              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {scopeLabel}

                {filters.street ? ` · ${filters.street}` : ""}
              </p>

              <div className="flex justify-center mt-3 w-full shrink-0 gap-2">
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={forceRefresh}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  aria-label="Atualizar usuários"
                >
                  <RefreshCw
                    size={18}
                    className={refreshing ? "animate-spin" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <label className="relative mt-4 block">
            <span className="sr-only">Pesquisar usuários</span>

            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por nome, telefone, e-mail ou endereço"
              className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
        </header>

        {response ? (
          <section className="grid grid-cols-2 gap-2 border-b border-zinc-200 p-3 sm:grid-cols-4 sm:p-4 dark:border-zinc-800">
            <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
              <Users size={17} className="text-cyan-600 dark:text-cyan-400" />

              <p className="mt-2 text-xs text-zinc-500">Usuários</p>

              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {response.summary.totalUsers}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
              <Phone
                size={17}
                className="text-emerald-600 dark:text-emerald-400"
              />

              <p className="mt-2 text-xs text-zinc-500">Com telefone</p>

              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {response.summary.usersWithPhone}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
              <Mail
                size={17}
                className="text-violet-600 dark:text-violet-400"
              />

              <p className="mt-2 text-xs text-zinc-500">Com e-mail</p>

              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {response.summary.usersWithEmail}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
              <WalletCards
                size={17}
                className="text-amber-600 dark:text-amber-400"
              />

              <p className="mt-2 text-xs text-zinc-500">Já contribuído</p>

              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrencyFromCents(
                  response.summary.totalContributedCents,
                )}
              </p>
            </div>
          </section>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && !response ? <LoadingList /> : null}

          {errorMessage ? (
            <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {!loading && !errorMessage && response?.items.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <UserRound className="mx-auto text-zinc-400" />

              <h3 className="mt-3 font-bold text-zinc-800 dark:text-zinc-200">
                Nenhum usuário encontrado
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Ajuste a pesquisa ou os filtros do dashboard.
              </p>
            </div>
          ) : null}

          {response?.items.length ? (
            <div
              className={[
                "grid gap-3 p-3 transition sm:grid-cols-2 sm:p-4",
                refreshing ? "opacity-60" : "",
              ].join(" ")}
            >
              {response.items.map((user) => (
                <article
                  key={user.id}
                  className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-cyan-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                        {user.fullname}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        {user.communityLabel}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                      {user.approvedPaymentCount}{" "}
                      {user.approvedPaymentCount === 1
                        ? "pagamento"
                        : "pagamentos"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <Phone
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      />

                      <span>
                        {user.phone
                          ? formatPhone(user.phone)
                          : "Telefone não informado"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <Mail
                        size={16}
                        className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400"
                      />

                      <span className="break-all">
                        {user.email ?? "E-mail não informado"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <MapPin
                        size={16}
                        className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
                      />

                      <span>
                        {getAddress(user.address1, user.addressNumber)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/60">
                    <div>
                      <p className="text-xs text-zinc-500">Total contribuído</p>

                      <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrencyFromCents(user.totalContributedCents)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">Último pagamento</p>

                      <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {user.lastPaymentAt
                          ? formatDate(user.lastPaymentAt)
                          : "Nunca pagou"}
                      </p>

                      {user.daysSinceLastPayment !== null ? (
                        <p className="mt-1 text-xs text-zinc-400">
                          Há {user.daysSinceLastPayment} dias
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
                    {user.phoneDigits ? (
                      <a
                        href={getWhatsAppUrl(user.phoneDigits)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-300 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                      >
                        <MessageCircle size={17} />
                        WhatsApp
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => openUserProfile(user.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
                    >
                      Abrir perfil
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        {response && response.totalPages > 1 ? (
          <footer className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 p-4 sm:flex-row dark:border-zinc-800">
            <p className="text-sm text-zinc-500">
              {response.totalCount} usuários encontrados
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={refreshing || page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
              >
                <ChevronLeft size={17} />
                Anterior
              </button>

              <span className="min-w-20 text-center text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                {page} de {response.totalPages}
              </span>

              <button
                type="button"
                disabled={refreshing || page >= response.totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(current + 1, response.totalPages),
                  )
                }
                className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
              >
                Próxima
                <ChevronRight size={17} />
              </button>
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
