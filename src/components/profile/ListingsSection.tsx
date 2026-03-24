import { Pencil, Trash2 } from "lucide-react";
import type { MyListingsData, ProfileListingItem } from "@/types/profile";

type ListingTab = "lostAnimals" | "lostAndFound" | "homeRent";

type Props = {
  listings: MyListingsData;
  activeTab: ListingTab;
  onTabChange: (tab: ListingTab) => void;
  onEdit: (item: ProfileListingItem) => void;
  onClose: (item: ProfileListingItem) => void;
  onDelete: (item: ProfileListingItem) => void;
  listingActionId: string | null;
};

function getListingTitle(item: ProfileListingItem) {
  if (item.listingType === "lost_animals") {
    return item.name;
  }

  return item.title;
}

function getListingAddress(item: ProfileListingItem) {
  if (item.listingType === "home_rent") {
    return item.address;
  }

  return "";
}

export default function ProfileListingsSection({
  listings,
  activeTab,
  onTabChange,
  onEdit,
  onClose,
  onDelete,
  listingActionId,
}: Props) {
  const tabs = [
    {
      key: "lostAnimals" as const,
      label: "Animais Perdidos",
      items: listings.lostAnimals.map(
        (item) =>
          ({
            ...item,
            listingType: "lost_animals",
          }) as ProfileListingItem,
      ),
    },
    {
      key: "lostAndFound" as const,
      label: "Achados e Perdidos",
      items: listings.lostAndFound.map(
        (item) =>
          ({
            ...item,
            listingType: "lost_and_found",
          }) as ProfileListingItem,
      ),
    },
    {
      key: "homeRent" as const,
      label: "Moradia",
      items: listings.homeRent.map(
        (item) =>
          ({
            ...item,
            listingType: "home_rent",
          }) as ProfileListingItem,
      ),
    },
  ];

  const activeTabData = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Meus anúncios
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie seus anúncios ativos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label} ({tab.items.length})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {activeTabData.items.map((item) => {
          const title = getListingTitle(item);
          const address = getListingAddress(item);

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {title}
                  </h3>

                  <p className="mt-1 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                    {item.description}
                  </p>

                  {address ? (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {address}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Pencil size={15} />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onClose(item)}
                    disabled={listingActionId === item.id}
                    className="rounded-2xl border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10"
                  >
                    Encerrar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    disabled={listingActionId === item.id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {activeTabData.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Nenhum anúncio encontrado nesta aba.
          </div>
        ) : null}
      </div>
    </section>
  );
}
