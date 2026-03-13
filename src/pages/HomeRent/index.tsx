import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CreateHomeRentModal from "@/components/ui/CreateHomeRentModal";
import { getHomeRentItems } from "@/services/supabase/home_rent";
import type { HomeRentItem } from "@/types/home_rent";
import { usePermissions } from "@/hooks/usePermissions";

export default function HomeRentPage() {
  const [items, setItems] = useState<HomeRentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPartnerAdOpen, setIsPartnerAdOpen] = useState(false);

  const navigate = useNavigate();
  const { permissions, loading: permissionsLoading } = usePermissions();

  const canCreateHomeRent = !!permissions?.canCreateHomeRent;

  useEffect(() => {
    async function loadItems() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getHomeRentItems();
        setItems(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar itens de moradia.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    void loadItems();
  }, []);

  function handleCreatedItem(item: HomeRentItem) {
    setItems((prev) => [item, ...prev]);
  }

  function handleCreateButtonClick() {
    if (canCreateHomeRent) {
      setIsCreateModalOpen(true);
      return;
    }

    setIsPartnerAdOpen(true);
  }

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-zinc-950 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-row justify-between gap-4">
            <div className="flex w-full flex-col justify-center">
              <h1 className="text-3xl font-bold text-white">Moradia</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Confira as casas oferecidas pela comunidade.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Voltar
            </button>
          </header>

          {loading || permissionsLoading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Carregando itens...
            </div>
          ) : null}

          {!loading && !permissionsLoading && errorMessage ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {!loading &&
          !permissionsLoading &&
          !errorMessage &&
          items.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Nenhum item encontrado.
            </div>
          ) : null}

          {!loading &&
          !permissionsLoading &&
          !errorMessage &&
          items.length > 0 ? (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/home-rent/${item.id}`)}
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
                            item.type === "sell"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {item.type === "sell" ? "Venda" : "Aluguel"}
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
                            Status:
                          </span>{" "}
                          {item.status === "open" ? "Em aberto" : "Resolvido"}
                        </p>
                        <p>
                          <span className="font-medium text-zinc-300">
                            Telefone:
                          </span>{" "}
                          {item.phone}
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
      </main>

      <button
        type="button"
        onClick={handleCreateButtonClick}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl font-light text-white shadow-2xl transition hover:scale-105"
        aria-label="Criar novo item"
      >
        +
      </button>

      <CreateHomeRentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreatedItem}
      />

      {isPartnerAdOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white">Torne-se sócio</h2>

            <p className="mt-3 text-sm text-zinc-300">
              Apenas sócios, presidentes e administradores podem publicar
              anúncios de moradia.
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Assine para desbloquear recursos premium e anunciar imóveis na
              plataforma.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPartnerAdOpen(false)}
                className="rounded-xl border border-zinc-700 px-4 py-3 font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPartnerAdOpen(false);
                  navigate("/dashboard");
                }}
                className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500"
              >
                Quero ser sócio
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
