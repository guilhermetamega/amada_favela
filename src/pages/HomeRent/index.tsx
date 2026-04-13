import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import HomeRentCreateEditModal from "@/components/homeRent/CreateEditModal";
import HomeRentDetailsModal from "@/components/homeRent/DetailsModal";
import HomeRentEmptyState from "@/components/homeRent/EmptyState";
import HomeRentFilters from "@/components/homeRent/Filters";
import HomeRentHeader from "@/components/homeRent/Header";
import HomeRentList from "@/components/homeRent/List";
import HomeRentPageSkeleton from "@/components/homeRent/PageSkeleton";
import ReportContentModal from "@/components/moderation/ReportContentModal";
import {
  getHomeRentCached,
  hydrateHomeRentCache,
  preloadHomeRentImages,
  revalidateHomeRentCache,
} from "@/lib/cache/homeRent";
import { getMyReportedContentIds } from "@/services/supabase/content_reports";
import type { ReportTarget } from "@/types/content_reports";
import type { HomeRentFiltersState, HomeRentItem } from "@/types/home_rent";
import { usePermissions } from "@/contexts/profile-context";
import AddButton from "@/components/homeRent/AddButton";

const initialFilters: HomeRentFiltersState = {
  search: "",
  type: "all",
  status: "all",
};

export default function HomeRentPage() {
  const {
    community,
    isPartnerActive,
    loading: profileLoading,
  } = usePermissions();

  const communityName = community?.trim() ?? "";

  const [items, setItems] = useState<HomeRentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState<HomeRentFiltersState>(initialFilters);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPartnerAdOpen, setIsPartnerAdOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HomeRentItem | null>(null);

  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function load() {
      if (profileLoading) return;

      if (!communityName) {
        setItems([]);
        setReportedIds(new Set());
        setErrorMessage(
          "Não foi possível identificar a comunidade do usuário.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setErrorMessage("");

        const cached = await getHomeRentCached(communityName);

        if (!active) return;

        setItems(cached.items);
        setLoading(false);
        preloadHomeRentImages(cached.items);

        setRefreshing(true);

        const fresh = await revalidateHomeRentCache(communityName);

        if (!active) return;

        setItems(fresh);
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar itens de moradia.",
        );
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (!active) return;

        setLoading(false);
        setRefreshing(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [communityName, profileLoading]);

  useEffect(() => {
    let active = true;

    async function loadReportedIds() {
      if (profileLoading) return;

      if (!items.length) {
        setReportedIds(new Set());
        return;
      }

      try {
        const ids = await getMyReportedContentIds(
          "home_rent",
          items.map((item) => item.id),
        );

        if (!active) return;
        setReportedIds(ids);
      } catch {
        if (!active) return;
        setReportedIds(new Set());
      }
    }

    void loadReportedIds();

    return () => {
      active = false;
    };
  }, [items, profileLoading]);

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.address.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search);

      const matchesType = filters.type === "all" || item.type === filters.type;
      const matchesStatus =
        filters.status === "all" || item.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filters, items]);

  function handleCreateButtonClick() {
    if (isPartnerActive) {
      setIsCreateModalOpen(true);
      return;
    }

    setIsPartnerAdOpen(true);
  }

  function handleSavedItem(item: HomeRentItem) {
    const nextItems = [item, ...items];
    setItems(nextItems);

    if (communityName) {
      hydrateHomeRentCache(communityName, nextItems);
    }
  }

  function handleOpenDetails(item: HomeRentItem) {
    setSelectedItem(item);
  }

  function handleReportItem(item: HomeRentItem) {
    setReportTarget({
      contentType: "home_rent",
      contentId: item.id,
      contentLabel: item.title,
    });
  }

  const isPageLoading = loading || profileLoading;
  const alreadyReportedCurrentTarget =
    !!reportTarget && reportedIds.has(reportTarget.contentId);

  return (
    <DashboardLayout>
      <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <HomeRentHeader />

          {isPageLoading ? <HomeRentPageSkeleton /> : null}

          {!isPageLoading ? (
            <>
              <HomeRentFilters value={filters} onChange={setFilters} />

              {refreshing ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Atualizando dados...
                </p>
              ) : null}
              <AddButton onClick={handleCreateButtonClick} />

              {errorMessage ? (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-600 dark:text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              {!errorMessage && filteredItems.length === 0 ? (
                <HomeRentEmptyState
                  canCreate={isPartnerActive}
                  onCreate={handleCreateButtonClick}
                />
              ) : null}

              {!errorMessage && filteredItems.length > 0 ? (
                <HomeRentList
                  items={filteredItems}
                  onOpen={handleOpenDetails}
                  onReport={handleReportItem}
                  reportedIds={reportedIds}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      <HomeRentCreateEditModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={handleSavedItem}
        communityName={communityName}
      />

      <HomeRentDetailsModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <ReportContentModal
        open={!!reportTarget}
        target={reportTarget}
        alreadyReported={alreadyReportedCurrentTarget}
        onSubmitted={(contentId) => {
          setReportedIds((prev) => {
            const next = new Set(prev);
            next.add(contentId);
            return next;
          });
        }}
        onClose={() => setReportTarget(null)}
      />

      {isPartnerAdOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/10 dark:text-amber-300">
              Recurso exclusivo
            </div>

            <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">
              Ative sua assinatura
            </h2>

            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              Apenas assinantes ativos podem publicar novos anúncios de moradia.
            </p>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Quando sua assinatura estiver ativa, o cadastro será liberado
              automaticamente.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPartnerAdOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => setIsPartnerAdOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
