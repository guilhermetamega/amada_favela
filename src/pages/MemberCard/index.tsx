import { useEffect, useMemo, useRef, useState } from "react";
import { Download, IdCard, MapPin, CalendarDays, Cake } from "lucide-react";
import { toPng } from "html-to-image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getMyMemberCardData } from "@/services/supabase/member_card";
import { MemberCardData } from "@/types/member_card";

function formatDate(date: string | null | undefined) {
  if (!date) return "Não informado";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Não informado";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function MemberCardPage() {
  const [cardData, setCardData] = useState<MemberCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloading, setDownloading] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMemberCard() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getMyMemberCardData();

        if (!active) return;
        setCardData(data);
      } catch (error) {
        if (!active) return;

        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar carteirinha.";

        setErrorMessage(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMemberCard();

    return () => {
      active = false;
    };
  }, []);

  async function handleDownloadCard() {
    if (!cardRef.current || !cardData || downloading) return;

    try {
      setDownloading(true);

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `carteirinha-${cardData.fullname
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      link.click();
    } catch {
      setErrorMessage("Não foi possível gerar a imagem da carteirinha.");
    } finally {
      setDownloading(false);
    }
  }

  const cardValidityText = useMemo(
    () => formatDate(cardData?.expiresAt),
    [cardData?.expiresAt],
  );

  return (
    <DashboardLayout>
      <main className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader
            title="Carteirinha Virtual"
            description="Visualize e baixe sua carteirinha de sócio."
            showBackButton
          />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Carregando carteirinha...
            </div>
          ) : null}

          {!loading && !errorMessage && cardData ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
                <div
                  ref={cardRef}
                  className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-linear-to-br from-zinc-950 via-zinc-900 to-emerald-950 p-5 text-white shadow-2xl"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-20">
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400 blur-3xl" />
                    <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-cyan-400 blur-3xl" />
                  </div>

                  <div className="relative z-10">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/90">
                          Associação
                        </p>
                        <h2 className="mt-1 flex items-center gap-2 text-lg font-bold sm:text-xl">
                          <IdCard className="h-5 w-5 text-emerald-300" />
                          Carteirinha de Sócio
                        </h2>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/95">
                        {cardData.associationLogoUrl ? (
                          <img
                            src={cardData.associationLogoUrl}
                            alt={`Logo da associação ${cardData.community}`}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="h-full w-full bg-zinc-200" />
                        )}
                      </div>
                    </div>

                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-800 text-2xl font-bold text-white/90">
                        {cardData.avatarUrl ? (
                          <img
                            src={cardData.avatarUrl}
                            alt={cardData.fullname}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span>{getInitials(cardData.fullname)}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                          Associado
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-tight sm:text-2xl">
                          {cardData.fullname}
                        </h3>
                        <p className="mt-2 rounded-full bg-white/8 px-3 py-1 text-xs text-emerald-200 backdrop-blur-sm">
                          Comunidade: {cardData.community}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                          <div className="mb-1 flex items-center gap-2 text-zinc-300">
                            <Cake className="h-4 w-4 text-emerald-300" />
                            <span className="text-xs uppercase tracking-wide">
                              Nascimento
                            </span>
                          </div>
                          <p className="font-semibold text-white">
                            {formatDate(cardData.birth)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                          <div className="mb-1 flex items-center gap-2 text-zinc-300">
                            <IdCard className="h-4 w-4 text-emerald-300" />
                            <span className="text-xs uppercase tracking-wide">
                              Idade
                            </span>
                          </div>
                          <p className="font-semibold text-white">
                            {cardData.age !== null
                              ? `${cardData.age} anos`
                              : "Não informada"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                        <div className="mb-1 flex items-center gap-2 text-zinc-300">
                          <MapPin className="h-4 w-4 text-emerald-300" />
                          <span className="text-xs uppercase tracking-wide">
                            Endereço
                          </span>
                        </div>
                        <p className="font-semibold text-white">
                          {cardData.fullAddress}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                          <div className="mb-1 flex items-center gap-2 text-zinc-300">
                            <CalendarDays className="h-4 w-4 text-emerald-300" />
                            <span className="text-xs uppercase tracking-wide">
                              Emissão
                            </span>
                          </div>
                          <p className="font-semibold text-white">
                            {formatDate(cardData.issuedAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                          <div className="mb-1 flex items-center gap-2 text-zinc-300">
                            <CalendarDays className="h-4 w-4 text-emerald-300" />
                            <span className="text-xs uppercase tracking-wide">
                              Validade
                            </span>
                          </div>
                          <p className="font-semibold text-white">
                            {cardValidityText}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                        Documento digital de identificação interna
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="text-xl font-semibold text-white">
                  Sua carteirinha está disponível para download
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Ao baixar, a carteirinha será gerada como imagem PNG. Em
                  celular, o arquivo normalmente vai para a pasta de downloads
                  do aparelho e pode aparecer na galeria, dependendo do sistema
                  e do navegador.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Nome completo
                    </p>
                    <p className="mt-1 font-medium text-white">
                      {cardData.fullname}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Comunidade
                    </p>
                    <p className="mt-1 font-medium text-white">
                      {cardData.community}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Emissão
                    </p>
                    <p className="mt-1 font-medium text-white">
                      {formatDate(cardData.issuedAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Expiração do sócio
                    </p>
                    <p className="mt-1 font-medium text-white">
                      {cardValidityText}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDownloadCard()}
                  disabled={downloading}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? "Gerando imagem..." : "Baixar carteirinha"}
                </button>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
