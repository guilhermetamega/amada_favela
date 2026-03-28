import { useEffect, useMemo, useState } from "react";
import type { WarningBanner } from "@/types/warning_banners";
import warningBg from "@/assets/warning_bg.png";

type Props = {
  items: WarningBanner[];
};

export default function DashboardWarningCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);

  const safeItems = useMemo(
    () => items.filter((item) => item?.message?.trim()),
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
      <article
        className="relative min-h-35 overflow-hidden"
        style={{
          backgroundImage: `url(${warningBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/85" />

        <div className="relative flex min-h-35 items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <p
              className="text-lg font-semibold leading-relaxed sm:text-2xl"
              style={{ color: current.text_color || "#ffffff" }}
            >
              {current.message}
            </p>
          </div>
        </div>

        {safeItems.length > 1 ? (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
            {safeItems.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={`h-2.5 rounded-full transition ${
                  itemIndex === index
                    ? "w-7 bg-white"
                    : "w-2.5 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Ir para aviso ${itemIndex + 1}`}
              />
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
