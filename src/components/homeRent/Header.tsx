import DashboardHeader from "@/components/layout/DashboardHeader";

type Props = {
  onCreate: () => void;
};

export default function HomeRentHeader({ onCreate }: Props) {
  return (
    <DashboardHeader
      title="Imóveis"
      actions={
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 w-11 pt-1.25 items-start justify-center rounded-2xl border border-sky-200 bg-sky-500 text-xl font-semibold text-white shadow-sm transition hover:scale-[1.03] hover:bg-sky-600 dark:border-sky-900/60 dark:bg-sky-500 dark:hover:bg-sky-400"
          aria-label="Criar novo item"
        >
          +
        </button>
      }
    />
  );
}
