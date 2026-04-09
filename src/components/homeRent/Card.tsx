import type { HomeRentItem } from "@/types/home_rent";
import ReportContentButton from "../moderation/ReportContentButton";

type Props = {
  item: HomeRentItem;
  onOpen: (item: HomeRentItem) => void;
  onReport: (item: HomeRentItem) => void;
  isReported?: boolean;
};

function getTypeLabel(type: HomeRentItem["type"]) {
  return type === "sell" ? "Venda" : "Aluguel";
}

function getStatusLabel(status: HomeRentItem["status"]) {
  return status === "open" ? "Em aberto" : "Fechado";
}

export default function HomeRentCard({
  item,
  onOpen,
  onReport,
  isReported = false,
}: Props) {
  return (
    <article className="group relative h-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <ReportContentButton
        onClick={() => onReport(item)}
        reported={isReported}
      />

      <button
        type="button"
        onClick={() => onOpen(item)}
        className="flex h-full w-full flex-col text-left"
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
                item.type === "sell"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              {getTypeLabel(item.type)}
            </span>
          </div>

          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="line-clamp-1">{item.address}</p>
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

            <span className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">
              Ver detalhes
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
