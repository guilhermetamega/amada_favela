import type { ServiceOrderCategory } from "@/types/service_orders";

type Props = {
  categories: ServiceOrderCategory[];
  selectedCategory: string;
  customIssue: string;
  address1: string;
  loading: boolean;
  onCategoryChange: (value: string) => void;
  onCustomIssueChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ServiceOrderForm({
  categories,
  selectedCategory,
  customIssue,
  address1,
  loading,
  onCategoryChange,
  onCustomIssueChange,
  onSubmit,
}: Props) {
  const isOther = selectedCategory === "outros";

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Nova ordem de serviço
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Seu endereço principal será usado automaticamente.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Endereço
          </label>
          <input
            value={address1}
            disabled
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tipo de ocorrência
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const active = selectedCategory === category.slug;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryChange(category.slug)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {isOther ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descreva o problema
            </label>
            <textarea
              value={customIssue}
              onChange={(e) => onCustomIssueChange(e.target.value)}
              rows={5}
              maxLength={180}
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Descreva a ocorrência"
            />
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={loading || !selectedCategory}
            onClick={onSubmit}
            className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Abrir ordem
          </button>
        </div>
      </div>
    </section>
  );
}
