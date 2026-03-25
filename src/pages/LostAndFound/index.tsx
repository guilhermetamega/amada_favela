import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import LostAndFoundCreateEditModal from "@/components/lostAndFound/CreateEditModal";
import LostAndFoundDetailsModal from "@/components/lostAndFound/DetailsModal";
import LostAndFoundEmptyState from "@/components/lostAndFound/EmptyState";
import LostAndFoundFilters from "@/components/lostAndFound/Filters";
import LostAndFoundHeader from "@/components/lostAndFound/Header";
import LostAndFoundHero from "@/components/lostAndFound/Hero";
import LostAndFoundList from "@/components/lostAndFound/List";
import LostAndFoundPageSkeleton from "@/components/lostAndFound/PageSkeleton";
import {
  getLostAndFoundCached,
  hydrateLostAndFoundCache,
  preloadLostAndFoundImages,
  revalidateLostAndFoundCache,
} from "@/lib/cache/lostAndFound";
import type {
  LostAndFoundFiltersState,
  LostAndFoundItem,
} from "@/types/lost_and_found";
import { usePermissions } from "@/hooks/usePermissions";

const initialFilters: LostAndFoundFiltersState = {
  search: "",
  type: "all",
  status: "all",
};

export default function LostAndFoundPage() {
  const { community, loading: profileLoading } = usePermissions();
  const communityName = community?.trim() ?? "";

  const [items, setItems] = useState<LostAndFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] =
    useState<LostAndFoundFiltersState>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostAndFoundItem | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (profileLoading) return;

      if (!communityName) {
        setItems([]);
        setErrorMessage(
          "Não foi possível identificar a comunidade do usuário.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setErrorMessage("");

        const cached = await getLostAndFoundCached(communityName);

        if (!active) return;

        setItems(cached.items);
        setLoading(false);
        preloadLostAndFoundImages(cached.items);

        setRefreshing(true);

        const fresh = await revalidateLostAndFoundCache(communityName);

        if (!active) return;

        setItems(fresh);
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar itens de achados e perdidos.",
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

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
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

  function handleSavedItem(item: LostAndFoundItem) {
    const nextItems = [item, ...items];
    setItems(nextItems);

    if (communityName) {
      hydrateLostAndFoundCache(communityName, nextItems);
    }
  }

  function handleOpenDetails(item: LostAndFoundItem) {
    setSelectedItem(item);
  }

  const isPageLoading = loading || profileLoading;

  return (
    <DashboardLayout>
      <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <LostAndFoundHeader onCreate={handleCreateButtonClick} />

          {isPageLoading ? <LostAndFoundPageSkeleton /> : null}

          {!isPageLoading ? (
            <>
              <LostAndFoundHero total={items.length} />

              <LostAndFoundFilters value={filters} onChange={setFilters} />

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

              {!errorMessage && filteredItems.length === 0 ? (
                <LostAndFoundEmptyState onCreate={handleCreateButtonClick} />
              ) : null}

              {!errorMessage && filteredItems.length > 0 ? (
                <LostAndFoundList
                  items={filteredItems}
                  onOpen={handleOpenDetails}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      <LostAndFoundCreateEditModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={handleSavedItem}
        communityName={communityName}
      />

      <LostAndFoundDetailsModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </DashboardLayout>
  );
}
