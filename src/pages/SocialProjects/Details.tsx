import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  HeartHandshake,
  Images,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import { getSocialProjectItemById } from "@/services/supabase/social_projects";
import type { SocialProjectItem } from "@/types/social_projects";

function normalizePhoneToWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function SocialProjectsDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<SocialProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    async function loadItem() {
      if (!id) {
        setErrorMessage("Projeto não encontrado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getSocialProjectItemById(id);
        setItem(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar projeto.";
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

  useEffect(() => {
    if (currentImageIndex > images.length - 1) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, images.length]);

  const whatsappLink = useMemo(() => {
    if (!item) return "#";

    const phone = normalizePhoneToWhatsapp(item.contact_phone);
    const message = `Olá! Vi o projeto social "${item.title}" e gostaria de saber como posso ajudar.`;

    return `https://wa.me/+55${phone}?text=${encodeURIComponent(message)}`;
  }, [item]);

  async function handleCopyPix() {
    if (!item?.pix_key) return;

    try {
      await navigator.clipboard.writeText(item.pix_key);
      setCopiedPix(true);
      window.setTimeout(() => setCopiedPix(false), 2200);
    } catch {
      setCopiedPix(false);
    }
  }

  function handlePreviousImage() {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function handleNextImage() {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  if (loading) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-6xl space-y-4 px-1 sm:space-y-5">
            <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-linear-to-br from-emerald-100 via-sky-100 to-pink-100 p-4 shadow-lg shadow-zinc-200/60 dark:border-zinc-800/80 dark:from-emerald-500/10 dark:via-sky-500/10 dark:to-pink-500/10 dark:shadow-black/20 sm:p-6">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-pink-400/25 blur-3xl dark:bg-pink-500/20" />

              <div className="relative z-10">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-300/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <HeartHandshake className="mr-1.5 h-3.5 w-3.5" />
                    Comunidade
                  </span>

                  <span className="inline-flex items-center rounded-full border border-sky-300/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 shadow-sm dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Projeto social
                  </span>
                </div>

                <div className="mt-4 max-w-3xl">
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl lg:text-4xl">
                    Carregando projeto...
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:text-base">
                    Aguarde enquanto buscamos as informações do projeto.
                  </p>
                </div>
              </div>
            </section>

            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-5 text-sm text-zinc-700 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-300">
              Carregando projeto...
            </div>
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  if (errorMessage || !item) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-6xl space-y-4 px-1 sm:space-y-5">
            <section className="relative overflow-hidden rounded-[28px] border border-red-300/60 bg-linear-to-br from-red-100 via-rose-100 to-orange-100 p-4 shadow-lg shadow-red-100/60 dark:border-red-500/20 dark:from-red-500/10 dark:via-rose-500/10 dark:to-orange-500/10 dark:shadow-black/20 sm:p-6">
              <div className="relative z-10">
                <h1 className="text-2xl font-black tracking-tight text-red-800 dark:text-red-200 sm:text-3xl">
                  Projeto não encontrado
                </h1>

                <p className="mt-3 text-sm leading-6 text-red-700 dark:text-red-300 sm:text-base">
                  Volte e tente novamente.
                </p>
              </div>
            </section>

            <div className="rounded-3xl border border-red-300/60 bg-red-50 p-5 text-sm text-red-700 shadow-md dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage || "Projeto não encontrado."}
            </div>
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4 px-1 sm:space-y-5">
          <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-linear-to-br from-emerald-100 via-sky-100 to-pink-100 p-4 shadow-lg shadow-zinc-200/60 dark:border-zinc-800/80 dark:from-emerald-500/10 dark:via-sky-500/10 dark:to-pink-500/10 dark:shadow-black/20 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-pink-400/25 blur-3xl dark:bg-pink-500/20" />

            <div className="relative z-10">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl lg:text-4xl">
                {" "}
                {item.title}
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:text-base">
                Veja as informações do projeto, entenda a proposta e descubra
                como apoiar essa iniciativa.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-4">
              <article className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white/95 shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:shadow-black/20">
                {images.length > 0 ? (
                  <>
                    <div className="relative">
                      <div className="aspect-4/4.5 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 sm:aspect-4/3">
                        <img
                          src={images[currentImageIndex]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/20 to-transparent px-4 pb-4 pt-16">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-100/90">
                              Projeto social
                            </p>

                            <h2 className="mt-2 line-clamp-2 text-xl font-black text-white sm:text-2xl">
                              {item.title}
                            </h2>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                              <Images className="mr-1.5 h-3.5 w-3.5" />
                              {images.length}{" "}
                              {images.length === 1 ? "imagem" : "imagens"}
                            </span>

                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold backdrop-blur ${
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

                      {images.length > 1 ? (
                        <>
                          <button
                            type="button"
                            onClick={handlePreviousImage}
                            className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                            aria-label="Imagem anterior"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>

                          <button
                            type="button"
                            onClick={handleNextImage}
                            className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                            aria-label="Próxima imagem"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}
                    </div>

                    {images.length > 1 ? (
                      <div className="flex gap-2 overflow-x-auto px-4 py-3">
                        {images.map((image, index) => {
                          const isActive = currentImageIndex === index;

                          return (
                            <button
                              key={`${image}-${index}`}
                              type="button"
                              onClick={() => setCurrentImageIndex(index)}
                              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition sm:h-20 sm:w-20 ${
                                isActive
                                  ? "border-emerald-400 shadow-lg shadow-emerald-500/10"
                                  : "border-zinc-200 dark:border-zinc-700/90 opacity-80 hover:opacity-100"
                              }`}
                              aria-label={`Ver imagem ${index + 1}`}
                            >
                              <img
                                src={image}
                                alt={`${item.title} ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                              {isActive ? (
                                <span className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/70" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex aspect-4/4.5 items-center justify-center bg-linear-to-br from-emerald-100 via-sky-100 to-pink-100 text-zinc-500 dark:from-emerald-500/15 dark:via-sky-500/10 dark:to-pink-500/15 dark:text-zinc-300 sm:aspect-4/3">
                    <div className="flex flex-col items-center gap-2">
                      <HeartHandshake className="h-8 w-8" />
                      <span className="text-sm font-medium">Sem imagens</span>
                    </div>
                  </div>
                )}
              </article>

              <section className="rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95">
                <h2 className="text-base font-black text-zinc-900 dark:text-white">
                  Descrição
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                  {item.description}
                </p>
              </section>

              {item.volunteer_info ? (
                <section className="rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95">
                  <h2 className="text-base font-black text-zinc-900 dark:text-white">
                    Como ajudar
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {item.volunteer_info}
                  </p>
                </section>
              ) : null}
            </section>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95 xl:sticky xl:top-6">
                <div>
                  <span className="inline-flex rounded-full border border-pink-300/60 bg-pink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-700 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-200">
                    Apoie este projeto
                  </span>

                  <h2 className="mt-3 text-lg font-black text-zinc-900 dark:text-white sm:text-xl">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Contribua com doações, voluntariado ou contato direto com a
                    equipe responsável.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-[2/3] gap-3">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                        <CalendarDays className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 text-left">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-sky-700/80 dark:text-sky-200/80">
                          Publicado
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-3 dark:border-green-500/20 dark:bg-green-500/10">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                        <Phone className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 text-left">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-green-700/80 dark:text-green-200/80">
                          Contato
                        </p>
                        <p className="mt-1 wrap-break-word text-sm font-semibold text-zinc-900 dark:text-white">
                          {item.contact_phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {item.address ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          <MapPin className="h-5 w-5" />
                        </span>

                        <div className="min-w-0 text-left">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-200/80">
                            Endereço
                          </p>
                          <p className="mt-1 line-clamp-3 wrap-break-word text-sm font-semibold text-zinc-900 dark:text-white">
                            {item.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-500/20 dark:bg-violet-500/10">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                          <QrCode className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-violet-700/80 dark:text-violet-200/80">
                            Status
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                            {item.status === "active"
                              ? "Projeto ativo"
                              : "Projeto inativo"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12.5 w-full items-center justify-center rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Entrar em contato via WhatsApp
                  </a>

                  {item.pix_key ? (
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="inline-flex min-h-12.5 w-full items-center justify-center rounded-2xl border border-pink-300/60 bg-pink-50 px-4 py-3 text-center text-sm font-semibold text-pink-700 transition hover:bg-pink-100 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-100 dark:hover:bg-pink-500/15"
                    >
                      {copiedPix ? (
                        <>
                          <QrCode className="mr-2 h-5 w-5" />
                          PIX copiado
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-5 w-5" />
                          Copiar chave PIX
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

                {item.pix_key ? (
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      Chave PIX
                    </p>
                    <p className="mt-2 break-all text-sm text-zinc-700 dark:text-zinc-200">
                      {item.pix_key}
                    </p>
                  </div>
                ) : null}
              </section>
            </aside>
          </div>
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
