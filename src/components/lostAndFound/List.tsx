import LostAndFoundCard from "@/components/lostAndFound/Card";
import type { LostAndFoundItem } from "@/types/lost_and_found";

type Props = {
  items: LostAndFoundItem[];
  onOpen: (item: LostAndFoundItem) => void;
  onReport: (item: LostAndFoundItem) => void;
  reportedIds: Set<string>;
};

export default function LostAndFoundList({
  items,
  onOpen,
  onReport,
  reportedIds,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <LostAndFoundCard
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
