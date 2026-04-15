import { useEffect, useMemo, useState } from "react";
import type { DashboardSponsorBannerItem } from "@/services/supabase/dashboard_sponsor_banners";

type Props = {
  items: DashboardSponsorBannerItem[];
  onOpen: (item: DashboardSponsorBannerItem) => void;
};

export default function DashboardSponsorBannerCarousel({
  items,
  onOpen,
}: Props) {
  const [index, setIndex] = useState(0);

  const safeItems = useMemo(
    () => items.filter((item) => item?.image_url?.trim()),
    [items],
  );

  useEffect(() => {
    if (safeItems.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(0);
      return;
    }

    if (index > safeItems.length - 1) {
      setIndex(0);
    }
  }, [safeItems.length, index]);

  useEffect(() => {
    if (safeItems.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeItems.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [safeItems.length]);

  if (!safeItems.length) return null;

  const current = safeItems[index];

  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => onOpen(current)}
        className="group block w-full text-left"
      >
        <article className="relative aspect-3/1 overflow-hidden">
          <img
            src={current.image_url}
            alt="Banner de patrocinador"
            className="absolute inset-0 h-full w-full object-contain"
          />

          <div className="absolute inset-0 transition group-hover:bg-black/25" />

          <div className="relative flex h-full items-end px-4 py-4 sm:px-6 sm:py-5">
            <div className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Abrir
            </div>
          </div>

          {safeItems.length > 1 ? (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
              {safeItems.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIndex(itemIndex);
                  }}
                  className={`h-2.5 rounded-full transition ${
                    itemIndex === index
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Ir para banner ${itemIndex + 1}`}
                />
              ))}
            </div>
          ) : null}
        </article>
      </button>
    </section>
  );
}
