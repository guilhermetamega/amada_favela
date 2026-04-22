import type { GroupedServiceOrder } from "@/types/service_orders";

type Props = {
  items: GroupedServiceOrder[];
  onResolve: (item: GroupedServiceOrder) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function GroupedOrdersList({ items, onResolve }: Props) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-[28px] border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Nenhuma ocorrência aberta no momento.
        </div>
      ) : (
        items.map((item) => (
          <article
            key={`${item.address_1}-${item.normalized_issue_key}`}
            className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="px-4 py-4 dark:border-zinc-800 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                      {item.category_label}
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {item.requests_count} solicitações
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.display_issue}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Endereço: {item.address_label}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Último registro em {formatDate(item.last_created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onResolve(item)}
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Finalizar ordem
                </button>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
