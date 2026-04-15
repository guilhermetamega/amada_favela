import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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
    if (!item) return [];

    return [item.image_primary_url, item.image_secondary_url].filter(
      Boolean,
    ) as string[];
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

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (pages.length > 1 && event.key === "ArrowRight") {
        setPageIndex((prev) => (prev + 1) % pages.length);
      }

      if (pages.length > 1 && event.key === "ArrowLeft") {
        setPageIndex((prev) => (prev - 1 + pages.length) % pages.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, pages.length]);

  if (!open || !item) return null;

  const whatsappUrl = buildWhatsappUrl(item.phone);
  const currentImage = pages[pageIndex] ?? "";

  return (
    <div className="fixed inset-0 z-80 bg-black/50 p-4 backdrop-blur-sm">
      <div className="mt-16 mx-auto flex h-fit max-w-4xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
          <h2 className="truncate text-lg font-semibold sm:text-xl">
            {item.store_name}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            {currentImage ? (
              <img
                src={currentImage}
                alt={`Encarte ${pageIndex + 1} de ${pages.length}`}
                className="mx-auto h-auto w-full max-w-2xl object-contain"
              />
            ) : (
              <div className="flex aspect-4/5 items-center justify-center text-sm text-zinc-500">
                Imagem indisponível
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
          <div className="flex flex-col gap-3">
            {pages.length > 1 ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPageIndex(
                      (prev) => (prev - 1 + pages.length) % pages.length,
                    )
                  }
                  className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Página anterior
                </button>

                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {pageIndex + 1} / {pages.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPageIndex((prev) => (prev + 1) % pages.length)
                  }
                  className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Próxima página
                </button>
              </div>
            ) : null}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900"
            >
              Ir para o WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
