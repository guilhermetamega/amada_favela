import { PlusCircle } from "lucide-react";

type Props = {
  title: string;
  scheduledAt: string;
  loading: boolean;
  onTitleChange: (value: string) => void;
  onScheduledAtChange: (value: string) => void;
  onSubmit: () => void;
};

export default function BingoAdminCreateForm({
  title,
  scheduledAt,
  loading,
  onTitleChange,
  onScheduledAtChange,
  onSubmit,
}: Props) {
  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
        Abrir novo bingo
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Informe título, data e hora para liberar a cartela dos moradores.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Título do bingo"
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => onScheduledAtChange(event.target.value)}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="button"
          disabled={loading || !title.trim() || !scheduledAt}
          onClick={onSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950"
        >
          <PlusCircle className="h-5 w-5" />
          Criar
        </button>
      </div>
    </section>
  );
}
