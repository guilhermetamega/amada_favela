import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { HomeRentItem } from "@/types/home_rent";

type Props = {
  open: boolean;
  item: HomeRentItem | null;
  onClose: () => void;
};

function normalizePhoneToWhatsapp(phone: string) {
  return phone.replace(/\D/g, "");
}

export default function HomeRentDetailsModal({ open, item, onClose }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
    };
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentImageIndex(0);
  }, [item?.id]);

  const images = useMemo(() => {
    if (!item) return [];

    return [item.pic_1_url, item.pic_2_url, item.pic_3_url].filter(
      Boolean,
    ) as string[];
  }, [item]);

  const whatsappLink = useMemo(() => {
    if (!item) return "#";

    const phone = normalizePhoneToWhatsapp(item.phone);
    const typeLabel = item.type === "sell" ? "venda" : "aluguel";
    const text = `Olá! Vi seu anúncio de ${typeLabel} no AMA da Favela e gostaria de saber mais.`;

    return `https://wa.me/+55${phone}?text=${encodeURIComponent(text)}`;
  }, [item]);

  if (!open || !item) return null;

  function handleNext() {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  function handlePrevious() {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  return (
    <div
      className="
        fixed inset-0 z-70 bg-black/60 backdrop-blur-[1px]
        flex items-end justify-center
        px-3
        pt-14
        pb-[calc(env(safe-area-inset-bottom)+7.5rem)]
        sm:items-center sm:p-4
      "
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="
          flex w-full flex-col overflow-hidden
          rounded-3xl border border-zinc-200 bg-white shadow-2xl
          dark:border-zinc-800 dark:bg-zinc-900
          max-h-[calc(100dvh-10rem-env(safe-area-inset-bottom))]
          sm:max-w-5xl sm:max-h-[94vh]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="mb-3 flex justify-center sm:hidden">
            <span className="h-1.5 w-14 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Detalhes do anúncio
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 overscroll-contain">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              {images.length > 0 ? (
                <>
                  <div className="relative overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800">
                    <div className="aspect-4/3">
                      <img
                        src={images[currentImageIndex]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {images.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevious}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-sm font-medium text-white"
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          onClick={handleNext}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-sm font-medium text-white"
                        >
                          →
                        </button>
                      </>
                    ) : null}
                  </div>

                  {images.length > 1 ? (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`overflow-hidden rounded-2xl border ${
                            currentImageIndex === index
                              ? "border-zinc-900 dark:border-white"
                              : "border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                            <img
                              src={image}
                              alt={`${item.title} ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex aspect-4/3 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Sem imagens
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Publicado em{" "}
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.type === "sell"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {item.type === "sell" ? "Venda" : "Aluguel"}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <p>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    Endereço:
                  </span>{" "}
                  {item.address}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    Status:
                  </span>{" "}
                  {item.status === "open" ? "Em aberto" : "Fechado"}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    Telefone:
                  </span>{" "}
                  {item.phone}
                </p>
              </div>

              <div className="mt-6">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Descrição
                </h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {item.description}
                </p>
              </div>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-green-600 px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Falar no WhatsApp
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
