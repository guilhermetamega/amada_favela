import LostAnimalsCard from "@/components/lostAnimals/Card";
import type { LostAnimalsItem } from "@/types/lost_animals";

type Props = {
  items: LostAnimalsItem[];
  onOpen: (item: LostAnimalsItem) => void;
};

export default function LostAnimalsList({ items, onOpen }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <LostAnimalsCard key={item.id} item={item} onOpen={onOpen} />
      ))}
    </section>
  );
}
