import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, HeartHandshake, MessageCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import { getSocialProjectsItems } from "@/services/supabase/social_projects";
import type { SocialProjectItem } from "@/types/social_projects";
import MainLayout from "@/components/layout/MainLayout";

export default function SocialProjectsPage() {
  const [items, setItems] = useState<SocialProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadItems() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getSocialProjectsItems();
        setItems(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar projetos sociais.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    void loadItems();
  }, []);

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl space-y-4 px-1 sm:space-y-5">
          <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-linear-to-br from-emerald-100 via-sky-100 to-pink-100 p-4 shadow-lg shadow-zinc-200/60 dark:border-zinc-800/80 dark:from-emerald-500/10 dark:via-sky-500/10 dark:to-pink-500/10 dark:shadow-black/20 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-pink-400/25 blur-3xl dark:bg-pink-500/20" />

            <div className="relative z-10">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl lg:text-4xl">
                🤝 Projetos que Transformam
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:text-base">
                Conheça iniciativas da comunidade, descubra quem está fazendo a
                diferença e veja como apoiar causas que realmente importam.
              </p>
            </div>
          </section>

          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-5 text-sm text-zinc-700 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-300">
              Carregando projetos...
            </div>
          ) : null}

          {!loading && errorMessage ? (
            <div className="rounded-3xl border border-red-300/60 bg-red-50 p-5 text-sm text-red-700 shadow-md dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {!loading && !errorMessage && items.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-5 text-sm text-zinc-700 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-300">
              Nenhum projeto social encontrado.
            </div>
          ) : null}

          {!loading && !errorMessage && items.length > 0 ? (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group h-full overflow-hidden rounded-[26px] border border-zinc-200 bg-white/95 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:hover:border-emerald-500/20 dark:hover:shadow-emerald-500/5"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/social-projects/${item.id}`)}
                    className="flex h-full w-full flex-col text-left"
                  >
                    <div className="relative">
                      <div className="aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        {item.pic_1_url ? (
                          <img
                            src={item.pic_1_url}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-emerald-100 via-sky-100 to-pink-100 text-zinc-500 dark:from-emerald-500/15 dark:via-sky-500/10 dark:to-pink-500/15 dark:text-zinc-300">
                            <HeartHandshake className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/20 to-transparent px-3 pb-3 pt-12">
                        <div className="flex items-end justify-between gap-2">
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur ${
                              item.status === "active"
                                ? "border border-emerald-300/30 bg-emerald-500/20 text-emerald-100"
                                : "border border-white/15 bg-black/35 text-zinc-100"
                            }`}
                          >
                            {item.status === "active" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col space-y-3 p-3 sm:p-4">
                      <div className="space-y-3">
                        <h2 className="line-clamp-2 text-sm font-black leading-5 text-zinc-900 dark:text-white sm:text-base">
                          {item.title}
                        </h2>

                        <div className="grid gap-2">
                          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-2.5 dark:border-sky-500/20 dark:bg-sky-500/10">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                                <MessageCircle className="h-4 w-4" />
                              </span>

                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700/80 dark:text-sky-200/80">
                                  Contato
                                </p>
                                <p className="mt-1 line-clamp-1 break-all text-xs font-semibold text-zinc-900 dark:text-white sm:text-sm">
                                  {item.contact_phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="line-clamp-3 text-center text-xs leading-5 text-zinc-600 dark:text-zinc-300 sm:text-sm">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-auto pt-1">
                        <span className="inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-emerald-500 to-green-500 px-3 py-2.5 text-xs font-semibold text-white shadow-md transition group-hover:opacity-95 sm:text-sm">
                          Ver detalhes
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
