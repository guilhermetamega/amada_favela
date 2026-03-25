import DashboardHeader from "@/components/layout/DashboardHeader";

type Props = {
  onCreate: () => void;
};

export default function LostAndFoundHeader({ onCreate }: Props) {
  return (
    <DashboardHeader
      title="Achados e Perdidos"
      actions={
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 w-11 pt-1.25 items-start justify-center rounded-2xl border border-amber-200 bg-amber-500 text-xl font-semibold text-white shadow-sm transition hover:scale-[1.03] hover:bg-amber-600 dark:border-amber-900/60 dark:bg-amber-500 dark:hover:bg-amber-400"
          aria-label="Criar novo item"
        >
          +
        </button>
      }
    />
  );
}
