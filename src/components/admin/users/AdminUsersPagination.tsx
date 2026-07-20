import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminUsersPaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

export default function AdminUsersPagination({
  page,
  totalPages,
  totalCount,
  disabled = false,
  onPageChange,
}: AdminUsersPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{totalCount} usuários encontrados</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ChevronLeft size={17} />
          Anterior
        </button>

        <span className="min-w-24 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {page} de {totalPages}
        </span>

        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Próxima
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
