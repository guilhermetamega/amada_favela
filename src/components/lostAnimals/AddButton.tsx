type Props = {
  onClick: () => void;
};

export default function AddButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-full pt-1.25 items-start justify-center rounded-2xl border border-amber-200 bg-amber-500 text-xl font-semibold text-white shadow-sm transition hover:scale-[1.03] hover:bg-amber-600 dark:border-amber-900/60 dark:bg-amber-500 dark:hover:bg-amber-400"
      aria-label="Criar novo item"
    >
      + Relatar Desaparecimento
    </button>
  );
}
