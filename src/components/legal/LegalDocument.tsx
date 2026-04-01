import type { LegalDocumentContent } from "@/lib/legal";

type Props = {
  content: LegalDocumentContent;
  compact?: boolean;
};

export default function LegalDocument({ content, compact = false }: Props) {
  return (
    <article className="mx-auto w-full max-w-4xl">
      <header className={compact ? "mb-5" : "mb-8"}>
        <div className="inline-flex rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          Documento jurídico
        </div>

        <h1
          className={`mt-3 font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${
            compact ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"
          }`}
        >
          {content.title}
        </h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {content.updatedAtLabel} · Versão {content.version}
        </p>
      </header>

      <div
        className={`rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
          compact ? "p-5 sm:p-6" : "p-6 sm:p-8"
        }`}
      >
        <div className="space-y-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          {content.intro.map((paragraph, index) => (
            <p key={`intro-${index}`}>{paragraph}</p>
          ))}
        </div>

        <div className={compact ? "mt-6 space-y-6" : "mt-8 space-y-8"}>
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2
                className={`font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 ${
                  compact ? "text-base" : "text-xl"
                }`}
              >
                {section.title}
              </h2>

              <div className="mt-3 space-y-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                {section.body.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
