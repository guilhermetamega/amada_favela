import HomeRentCard from "@/components/homeRent/Card";
import type { HomeRentItem } from "@/types/home_rent";

type Props = {
  items: HomeRentItem[];
  onOpen: (item: HomeRentItem) => void;
  onReport: (item: HomeRentItem) => void;
  reportedIds: Set<string>;
};

export default function HomeRentList({
  items,
  onOpen,
  onReport,
  reportedIds,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <HomeRentCard
          key={item.id}
          item={item}
          onOpen={onOpen}
          onReport={onReport}
          isReported={reportedIds.has(item.id)}
        />
      ))}
    </section>
  );
}
