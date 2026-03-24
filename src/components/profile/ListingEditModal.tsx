import { LoaderCircle, Save, X } from "lucide-react";

export type ListingEditState =
  | {
      listingType: "lost_animals";
      id: string;
      name: string;
      description: string;
      type: "lost" | "found";
      phone: string;
    }
  | {
      listingType: "lost_and_found";
      id: string;
      title: string;
      description: string;
      type: "lost" | "found";
      phone: string;
    }
  | {
      listingType: "home_rent";
      id: string;
      title: string;
      description: string;
      type: "sell" | "rent";
      address: string;
      phone: string;
    };

type Props = {
  value: ListingEditState | null;
  loading: boolean;
  errorMessage: string;
  onChange: (value: ListingEditState) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export default function ListingEditModal({
  value,
  loading,
  errorMessage,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  if (!value) return null;

  const title = value.listingType === "lost_animals" ? value.name : value.title;

  function updateCommon(
    patch: Partial<Pick<ListingEditState, "description" | "phone" | "type">>,
  ) {
    onChange({
      ...value,
      ...patch,
    } as ListingEditState);
  }

  function updateLostAnimals(
    patch: Partial<Extract<ListingEditState, { listingType: "lost_animals" }>>,
  ) {
    if (value?.listingType !== "lost_animals") return;

    onChange({
      ...value,
      ...patch,
    });
  }

  function updateLostAndFound(
    patch: Partial<
      Extract<ListingEditState, { listingType: "lost_and_found" }>
    >,
  ) {
    if (value?.listingType !== "lost_and_found") return;

    onChange({
      ...value,
      ...patch,
    });
  }

  function updateHomeRent(
    patch: Partial<Extract<ListingEditState, { listingType: "home_rent" }>>,
  ) {
    if (value?.listingType !== "home_rent") return;

    onChange({
      ...value,
      ...patch,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Editar anúncio
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {value.listingType === "lost_animals" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nome
              </label>
              <input
                value={value.name}
                onChange={(e) => updateLostAnimals({ name: e.target.value })}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Título
              </label>
              <input
                value={value.title}
                onChange={(e) =>
                  value.listingType === "lost_and_found"
                    ? updateLostAndFound({ title: e.target.value })
                    : updateHomeRent({ title: e.target.value })
                }
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          )}

          {value.listingType === "home_rent" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Endereço
              </label>
              <input
                value={value.address}
                onChange={(e) => updateHomeRent({ address: e.target.value })}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descrição
            </label>
            <textarea
              value={value.description}
              onChange={(e) => updateCommon({ description: e.target.value })}
              rows={5}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Telefone
            </label>
            <input
              value={value.phone}
              onChange={(e) => updateCommon({ phone: e.target.value })}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tipo
            </label>
            <select
              value={value.type}
              onChange={(e) =>
                updateCommon({
                  type: e.target.value as "lost" | "found" | "sell" | "rent",
                })
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {value.listingType === "home_rent" ? (
                <>
                  <option value="sell">Venda</option>
                  <option value="rent">Aluguel</option>
                </>
              ) : (
                <>
                  <option value="lost">Perdido</option>
                  <option value="found">Encontrado</option>
                </>
              )}
            </select>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
