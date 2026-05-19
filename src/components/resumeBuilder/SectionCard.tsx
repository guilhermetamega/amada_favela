export default function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
