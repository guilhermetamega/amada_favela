import warningBg from "@/assets/warning_bg.png";

type Props = {
  message: string;
  textColor: string;
  expiresAt: string;
};

function formatExpiresAt(value: string) {
  if (!value) return "Sem data definida";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Sem data definida";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function BannerPreview({
  message,
  textColor,
  expiresAt,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Pré-visualização
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Visual real do banner exibido no dashboard.
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <article
          className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800"
          style={{
            backgroundImage: `url(${warningBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/85" />

          <div className="relative px-5 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl text-center">
              <p
                className="text-lg font-semibold leading-relaxed sm:text-xl md:text-2xl"
                style={{ color: textColor }}
              >
                {message.trim() || "Seu comunicado aparecerá aqui."}
              </p>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cor do texto
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {textColor.toUpperCase()}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Expiração
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {formatExpiresAt(expiresAt)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
