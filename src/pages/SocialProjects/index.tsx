import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
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
      <MainLayout className="bg-zinc-950">
        <div className="mx-auto max-w-7xl">
          <DashboardHeader title="Projetos Sociais" />

          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Carregando projetos...
            </div>
          ) : null}

          {!loading && errorMessage ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {!loading && !errorMessage && items.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Nenhum projeto social encontrado.
            </div>
          ) : null}

          {!loading && !errorMessage && items.length > 0 ? (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/social-projects/${item.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-zinc-800">
                      <img
                        src={item.pic_1_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition hover:scale-[1.02]"
                      />
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="line-clamp-2 text-lg font-semibold text-white">
                          {item.title}
                        </h2>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                            item.status === "active"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {item.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-zinc-400">
                        <p>
                          <span className="font-medium text-zinc-300">
                            Comunidade:
                          </span>{" "}
                          {item.community}
                        </p>
                        <p>
                          <span className="font-medium text-zinc-300">
                            Contato:
                          </span>{" "}
                          {item.contact_phone}
                        </p>
                      </div>

                      <p className="line-clamp-3 text-sm text-zinc-300">
                        {item.description}
                      </p>
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
