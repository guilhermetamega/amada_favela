import LostAnimalsCard from "@/components/lostAnimals/Card";
import type { LostAnimalsItem } from "@/types/lost_animals";

type Props = {
  items: LostAnimalsItem[];
  onOpen: (item: LostAnimalsItem) => void;
  onReport: (item: LostAnimalsItem) => void;
  reportedIds: Set<string>;
};

export default function LostAnimalsList({
  items,
  onOpen,
  onReport,
  reportedIds,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <LostAnimalsCard
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
