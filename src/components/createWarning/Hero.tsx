type Props = {
  title?: string;
  description?: string;
};

export default function CreateWarningHero({
  title = "Criar Comunicado",
  description,
}: Props) {
  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white px-5 py-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 sm:py-7">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
        {title}
      </h1>

      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-[15px]">
        {description}
      </p>
    </section>
  );
}
