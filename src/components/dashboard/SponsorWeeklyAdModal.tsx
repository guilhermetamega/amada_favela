import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

import { buildWhatsappUrl } from "@/services/supabase/sponsor_weekly_ad";
import type { SponsorWeeklyAd } from "@/types/sponsor-weekly-ad";

type Props = {
  open: boolean;
  item: SponsorWeeklyAd | null;
  onClose: () => void;
};

export default function DashboardSponsorWeeklyAdModal({
  open,
  item,
  onClose,
}: Props) {
  const pages = useMemo(() => {
    if (!item) {
      return [];
    }

    return [item.image_primary_url, item.image_secondary_url].filter(
      (imageUrl): imageUrl is string =>
        typeof imageUrl === "string" && imageUrl.trim().length > 0,
    );
  }, [item]);

  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPageIndex(0);
      return;
    }

    setPageIndex(0);
  }, [open, item?.id]);

  /*
   * Bloqueia somente o scroll da página que está
   * atrás do modal.
   *
   * Não usamos touch-action: none, pois isso pode
   * impedir a navegação por toque dentro do próprio
   * modal em alguns navegadores mobile.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;

    const previousHtmlOverflow = document.documentElement.style.overflow;

    const previousBodyOverscrollBehavior =
      document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";

    document.documentElement.style.overflow = "hidden";

    document.body.style.overscrollBehavior = "contain";

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      document.documentElement.style.overflow = previousHtmlOverflow;

      document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (pages.length > 1 && event.key === "ArrowRight") {
        setPageIndex((current) => (current + 1) % pages.length);

        return;
      }

      if (pages.length > 1 && event.key === "ArrowLeft") {
        setPageIndex((current) => (current - 1 + pages.length) % pages.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, pages.length]);

  if (!open || !item) {
    return null;
  }

  const whatsappUrl = buildWhatsappUrl(item.phone);

  const currentImage = pages[pageIndex] ?? "";

  function previousPage() {
    if (pages.length <= 1) {
      return;
    }

    setPageIndex((current) => (current - 1 + pages.length) % pages.length);
  }

  function nextPage() {
    if (pages.length <= 1) {
      return;
    }

    setPageIndex((current) => (current + 1) % pages.length);
  }

  return (
    <div
      className="fixed inset-0 z-80 flex min-h-0 items-center justify-center overflow-hidden bg-black/55 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-ad-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex
          h-[calc(100dvh-1rem)]
          max-h-[calc(100dvh-1rem)]
          w-full
          max-w-4xl
          min-h-0
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-zinc-200
          bg-white
          shadow-2xl
          dark:border-zinc-800
          dark:bg-zinc-900
          sm:h-[calc(100dvh-2rem)]
          sm:max-h-[calc(100dvh-2rem)]
          sm:rounded-[28px]
          lg:max-h-225
        "
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* Cabeçalho fixo */}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2
              id="weekly-ad-modal-title"
              className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl"
            >
              {item.store_name}
            </h2>

            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
              Encarte promocional
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Fechar encarte"
          >
            <X size={18} />
          </button>
        </header>

        {/*
         * Área central flexível.
         *
         * min-h-0 permite que esta área diminua dentro
         * do container flex sem empurrar o rodapé para
         * fora da tela.
         */}
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-zinc-100 p-2 dark:bg-zinc-950 sm:p-4">
          <div className="flex h-full w-full min-h-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl">
            {currentImage ? (
              <img
                src={currentImage}
                alt={`Encarte ${pageIndex + 1} de ${pages.length}`}
                className="
                  block
                  max-h-full
                  max-w-full
                  select-none
                  object-contain
                "
                draggable={false}
              />
            ) : (
              <div className="flex h-full min-h-48 w-full items-center justify-center px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Imagem indisponível
              </div>
            )}
          </div>
        </main>

        {/* Rodapé sempre visível */}
        <footer className="shrink-0 border-t border-zinc-200 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 sm:pt-4 sm:pb-4">
          <div className="flex flex-col gap-3">
            {pages.length > 1 ? (
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={previousPage}
                  className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl border border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                  <ChevronLeft size={16} className="shrink-0" />

                  <span className="sm:hidden">Anterior</span>

                  <span className="hidden truncate sm:inline">
                    Página anterior
                  </span>
                </button>

                <span className="whitespace-nowrap px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm">
                  {pageIndex + 1} / {pages.length}
                </span>

                <button
                  type="button"
                  onClick={nextPage}
                  className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl border border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                  <span className="sm:hidden">Próxima</span>

                  <span className="hidden truncate sm:inline">
                    Próxima página
                  </span>

                  <ChevronRight size={16} className="shrink-0" />
                </button>
              </div>
            ) : null}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:bg-white dark:text-zinc-900 sm:rounded-2xl sm:px-5 sm:py-3"
            >
              <ExternalLink size={17} />
              Ir para o WhatsApp
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
