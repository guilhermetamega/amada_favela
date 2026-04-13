type Props = {
  onClick: () => void;
};

export default function AddButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-full pt-1.25 items-start justify-center rounded-2xl border border-sky-200 bg-sky-500 text-xl font-semibold text-white shadow-sm transition hover:scale-[1.03] hover:bg-sky-600 dark:border-sky-900/60 dark:bg-sky-500 dark:hover:bg-sky-400"
      aria-label="Criar novo item"
    >
      + Adicionar Novo Item
    </button>
  );
}
