import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  MessageCircle,
  Percent,
  Search,
  Store,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";
import { getDiscountStores } from "@/services/supabase/discount_club";
import type { DiscountStore } from "@/types/discount_club";

function titleCase(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

export default function DiscountClubPage() {
  const [stores, setStores] = useState<DiscountStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("Todos");

  useEffect(() => {
    getDiscountStores()
      .then(setStores)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Erro ao carregar lojas.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const niches = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(
          stores
            .map((store) => store.niche)
            .filter((value): value is string => !!value),
        ),
      ).sort(),
    ],
    [stores],
  );
  const filtered = useMemo(
    () =>
      stores.filter(
        (store) =>
          (niche === "Todos" || store.niche === niche) &&
          `${store.name} ${store.niche ?? ""} ${store.community}`
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [stores, niche, query],
  );

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl space-y-4 px-1 sm:space-y-5">
          <DashboardHeader title="Clube de Descontos" />
          <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-linear-to-br from-emerald-100 via-sky-100 to-amber-100 p-4 shadow-lg shadow-zinc-200/60 dark:border-zinc-800/80 dark:from-emerald-500/10 dark:via-sky-500/10 dark:to-amber-500/10 dark:shadow-black/20 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                <Store className="h-4 w-4" /> Benefícios da comunidade
              </span>
              <p className="mt-2 w-full text-center text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:text-base">
                Apoie os negócios locais e aproveite vantagens exclusivas
                oferecidas por lojistas parceiros da associação.
              </p>
            </div>
          </section>
          <section className="grid gap-3 rounded-3xl border border-zinc-200 bg-white/90 p-3 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95 sm:grid-cols-[1fr_auto] sm:p-4">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar loja ou segmento"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </label>
            <select
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {niches.map((item) => (
                <option key={item} value={item}>
                  {titleCase(item)}
                </option>
              ))}
            </select>
          </section>
          {loading && (
            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Carregando benefícios...
            </div>
          )}
          {!loading && error && (
            <div className="rounded-3xl border border-red-300/60 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Nenhum benefício encontrado para sua busca.
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((store) => (
                <article
                  key={store.id}
                  className="group overflow-hidden rounded-[26px] border border-zinc-200 bg-white/95 shadow-md transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800/80 dark:bg-zinc-900/95"
                >
                  <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {store.photo_url ? (
                      <img
                        src={store.photo_url}
                        alt={store.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-linear-to-br from-emerald-100 to-sky-100 text-emerald-700 dark:from-emerald-500/15 dark:to-sky-500/10 dark:text-emerald-300">
                        <Store className="h-12 w-12" />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-black text-white shadow-lg sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-sm">
                      <Percent className="h-4 w-4" />
                      {store.discount_percent}% OFF
                    </span>
                    {store.premium && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border border-white/30 bg-sky-600/90 px-2 py-1 text-[9px] font-bold text-white shadow-lg sm:bottom-auto sm:right-3 sm:top-3 sm:px-2.5 sm:py-1.5 sm:text-[10px]">
                        <BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Verificada
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 p-3 sm:p-4">
                    <div>
                      <h2 className="line-clamp-1 text-sm font-black text-zinc-900 dark:text-white sm:text-base">
                        {store.name}
                      </h2>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {(store.niche ?? "Comércio local").toLocaleUpperCase(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                    {store.whatsapp ? (
                      <a
                        href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-500 to-green-500 px-3 py-2.5 text-xs font-semibold text-white shadow-md sm:text-sm"
                      >
                        <MessageCircle className="h-4 w-4" /> Falar com a loja
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
