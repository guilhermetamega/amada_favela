import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ServiceOrder } from "@/types/service_orders";

type Props = {
  items: ServiceOrder[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MyOrdersList({ items }: Props) {
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = items.length > 3;

  const visibleItems = useMemo(() => {
    if (!shouldCollapse || expanded) return items;
    return items.slice(0, 3);
  }, [items, shouldCollapse, expanded]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Minhas ordens
        </h2>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            Você ainda não abriu nenhuma ordem.
          </div>
        ) : (
          <>
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                    {item.category_label}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      item.status === "open"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {item.status === "open" ? "Em aberto" : "Finalizada"}
                  </span>
                </div>

                {item.custom_issue ? (
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.custom_issue}
                  </p>
                ) : null}

                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Criada em {formatDate(item.created_at)}
                </p>
              </article>
            ))}

            {shouldCollapse ? (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span>
                    {expanded
                      ? "Mostrar menos"
                      : `Mostrar mais ${items.length - 3}`}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`transition ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
