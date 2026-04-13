import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import LostAnimalsCreateEditModal from "@/components/lostAnimals/CreateEditModal";
import LostAnimalsDetailsModal from "@/components/lostAnimals/DetailsModal";
import LostAnimalsEmptyState from "@/components/lostAnimals/EmptyState";
import LostAnimalsFilters from "@/components/lostAnimals/Filters";
import LostAnimalsHeader from "@/components/lostAnimals/Header";
import LostAnimalsList from "@/components/lostAnimals/List";
import LostAnimalsPageSkeleton from "@/components/lostAnimals/PageSkeleton";
import ReportContentModal from "@/components/moderation/ReportContentModal";
import {
  getLostAnimalsCached,
  hydrateLostAnimalsCache,
  preloadLostAnimalsImages,
  revalidateLostAnimalsCache,
} from "@/lib/cache/lostAnimals";
import { getMyReportedContentIds } from "@/services/supabase/content_reports";
import type { ReportTarget } from "@/types/content_reports";
import type {
  LostAnimalsFiltersState,
  LostAnimalsItem,
} from "@/types/lost_animals";
import { usePermissions } from "@/hooks/usePermissions";
import AddButton from "@/components/lostAnimals/AddButton";
import MainLayout from "@/components/layout/MainLayout";

const initialFilters: LostAnimalsFiltersState = {
  search: "",
  type: "all",
  status: "all",
};

export default function LostAnimalsPage() {
  const { community, loading: profileLoading } = usePermissions();
  const communityName = community?.trim() ?? "";

  const [items, setItems] = useState<LostAnimalsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] =
    useState<LostAnimalsFiltersState>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostAnimalsItem | null>(
    null,
  );

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

        const cached = await getLostAnimalsCached(communityName);

        if (!active) return;

        setItems(cached.items);
        setLoading(false);
        preloadLostAnimalsImages(cached.items);

        setRefreshing(true);

        const fresh = await revalidateLostAnimalsCache(communityName);

        if (!active) return;

        setItems(fresh);
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar itens de animais perdidos e achados.",
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
          "lost_animals",
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
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search);

      const matchesType = filters.type === "all" || item.type === filters.type;
      const matchesStatus =
        filters.status === "all" || item.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filters, items]);

  function handleCreateButtonClick() {
    setIsCreateModalOpen(true);
  }

  function handleSavedItem(item: LostAnimalsItem) {
    const nextItems = [item, ...items];
    setItems(nextItems);

    if (communityName) {
      hydrateLostAnimalsCache(communityName, nextItems);
    }
  }

  function handleOpenDetails(item: LostAnimalsItem) {
    setSelectedItem(item);
  }

  function handleReportItem(item: LostAnimalsItem) {
    setReportTarget({
      contentType: "lost_animals",
      contentId: item.id,
      contentLabel: item.name,
    });
  }

  const isPageLoading = loading || profileLoading;
  const alreadyReportedCurrentTarget =
    !!reportTarget && reportedIds.has(reportTarget.contentId);

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <LostAnimalsHeader />

          {isPageLoading ? <LostAnimalsPageSkeleton /> : null}

          {!isPageLoading ? (
            <>
              <LostAnimalsFilters value={filters} onChange={setFilters} />

              {refreshing ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Atualizando dados...
                </p>
              ) : null}

              {errorMessage ? (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-600 dark:text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              <AddButton onClick={handleCreateButtonClick} />

              {!errorMessage && filteredItems.length === 0 ? (
                <LostAnimalsEmptyState onCreate={handleCreateButtonClick} />
              ) : null}

              {!errorMessage && filteredItems.length > 0 ? (
                <LostAnimalsList
                  items={filteredItems}
                  onOpen={handleOpenDetails}
                  onReport={handleReportItem}
                  reportedIds={reportedIds}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </MainLayout>

      <LostAnimalsCreateEditModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={handleSavedItem}
        communityName={communityName}
      />

      <LostAnimalsDetailsModal
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
    </DashboardLayout>
  );
}
