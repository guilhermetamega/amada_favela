import { useEffect, useState } from "react";
import type { WarningBanner } from "@/types/warning_banners";

type Props = {
  items: WarningBanner[];
};

export default function DashboardWarningCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const current = items[index];

  return (
    <section className="mb-5 overflow-hidden rounded-3xl border border-zinc-200 shadow-sm dark:border-zinc-800">
      <article
        className="relative min-h-45 sm:min-h-55"
        style={{
          backgroundImage: `url(${current.background_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative flex min-h-45 items-end p-5 sm:min-h-55 sm:p-6">
          <div className="max-w-3xl">
            <p
              className="text-lg font-semibold leading-snug sm:text-2xl"
              style={{ color: current.text_color }}
            >
              {current.message}
            </p>
          </div>
        </div>

        {items.length > 1 ? (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {items.map((item, itemIndex) => (
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
