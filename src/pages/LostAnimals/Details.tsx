import { useEffect, useMemo, useState } from "react";
import { getLostAnimalsItemById } from "@/services/supabase/lost_animals";
import type { LostAnimalsItem } from "@/types/lost_animals";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useParams } from "react-router-dom";

function normalizePhoneToWhatsapp(phone: string) {
  return phone.replace(/\D/g, "");
}

export default function LostAnimalsDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<LostAnimalsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function loadItem() {
      if (!id) {
        setErrorMessage("Item não encontrado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getLostAnimalsItemById(id);
        setItem(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar o item.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    void loadItem();
  }, [id]);

  const images = useMemo(() => {
    if (!item) return [];

    return [item.pic_1_url, item.pic_2_url, item.pic_3_url].filter(
      Boolean,
    ) as string[];
  }, [item]);

  const whatsappLink = useMemo(() => {
    if (!item) return "#";

    const phone = normalizePhoneToWhatsapp(item.phone);
    const typeLabel = item.type === "lost" ? "perdido" : "achado";
    const message = `Olá! Vi seu animal ${typeLabel}, gostaria de te ajudar a recuperá-lo`;

    return `https://wa.me/+55${phone}?text=${encodeURIComponent(message)}`;
  }, [item]);

  function handlePreviousImage() {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function handleNextImage() {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
          Carregando item...
        </div>
      </main>
    );
  }

  if (errorMessage || !item) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-4">
          <DashboardHeader
            title="Erro ao encontrar item"
            description="Volte e tente novamente."
            showBackButton
          />

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            {errorMessage || "Item não encontrado."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-zinc-950 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <DashboardHeader
            title="Detalhes da publicação"
            description=""
            showBackButton
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
              {images.length > 0 ? (
                <>
                  <div className="relative overflow-hidden rounded-2xl bg-zinc-800">
                    <div className="aspect-square w-full">
                      <img
                        src={images[currentImageIndex]}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {images.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={handlePreviousImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                          aria-label="Imagem anterior"
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                          aria-label="Próxima imagem"
                        >
                          →
                        </button>
                      </>
                    ) : null}
                  </div>

                  {images.length > 1 ? (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {images.map((image, index) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`overflow-hidden rounded-xl border ${
                            currentImageIndex === index
                              ? "border-white"
                              : "border-zinc-700"
                          }`}
                        >
                          <div className="aspect-square w-full bg-zinc-800">
                            <img
                              src={image}
                              alt={`${item.name} ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                  Sem imagens
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-white">{item.name}</h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    Publicado em{" "}
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    item.type === "lost"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {item.type === "lost" ? "Perdido" : "Achado"}
                </span>
              </div>

              <div className="space-y-3 text-sm text-zinc-300">
                <p>
                  <span className="font-semibold text-white">Comunidade:</span>{" "}
                  {item.community}
                </p>
                <p>
                  <span className="font-semibold text-white">Status:</span>{" "}
                  {item.status === "open" ? "Em aberto" : "Resolvido"}
                </p>
                <p>
                  <span className="font-semibold text-white">Telefone:</span>{" "}
                  {item.phone}
                </p>
              </div>

              <div className="mt-6">
                <h2 className="mb-2 text-lg font-semibold text-white">
                  Descrição
                </h2>
                <p className="whitespace-pre-line text-zinc-300">
                  {item.description}
                </p>
              </div>

              <div className="mt-8">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-green-500 px-4 py-3 text-center font-semibold text-white transition hover:opacity-90"
                >
                  Entrar em contato via WhatsApp
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
