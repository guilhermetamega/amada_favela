export default function Section({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "space-y-1.5" : "space-y-2"}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  );
}
