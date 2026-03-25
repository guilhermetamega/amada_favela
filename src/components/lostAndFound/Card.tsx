import type { LostAndFoundItem } from "@/types/lost_and_found";

type Props = {
  item: LostAndFoundItem;
  onOpen: (item: LostAndFoundItem) => void;
};

function getTypeLabel(type: LostAndFoundItem["type"]) {
  return type === "lost" ? "Perdido" : "Achado";
}

function getStatusLabel(status: LostAndFoundItem["status"]) {
  return status === "open" ? "Em aberto" : "Resolvido";
}

export default function LostAndFoundCard({ item, onOpen }: Props) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="block w-full text-left"
      >
        <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={item.pic_1_url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />

          <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/30 to-transparent" />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-base font-semibold text-zinc-900 dark:text-white sm:text-lg">
              {item.title}
            </h3>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.type === "lost"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {getTypeLabel(item.type)}
            </span>
          </div>

          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p>{item.phone}</p>
          </div>

          <p className="line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">
            {item.description}
          </p>

          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                item.status === "open"
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {getStatusLabel(item.status)}
            </span>

            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Ver detalhes
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
