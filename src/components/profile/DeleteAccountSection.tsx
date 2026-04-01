import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  loading: boolean;
  onDelete: () => Promise<void>;
};

const CONFIRMATION_TEXT = "CONFIRMAR";

export default function ProfileDeleteAccountSection({
  loading,
  onDelete,
}: Props) {
  const [confirmationValue, setConfirmationValue] = useState("");

  const canDelete = useMemo(
    () => confirmationValue.trim().toUpperCase() === CONFIRMATION_TEXT,
    [confirmationValue],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canDelete || loading) return;
    await onDelete();
  }

  return (
    <section className="rounded-[28px] border border-red-200 bg-white p-5 shadow-sm dark:border-red-500/20 dark:bg-zinc-900 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle size={20} />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Excluir conta permanentemente
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Esta ação remove sua conta de forma definitiva. O processo é
            irreversível e poderá apagar seus dados pessoais, acessos e
            registros vinculados à plataforma, observadas apenas as retenções
            legalmente exigidas.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/80 p-4 dark:border-red-500/20 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          Para confirmar, digite{" "}
          <span className="font-bold tracking-wide">{CONFIRMATION_TEXT}</span>{" "}
          no campo abaixo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="delete-account-confirmation"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Confirmação textual
          </label>

          <input
            id="delete-account-confirmation"
            type="text"
            value={confirmationValue}
            onChange={(event) => setConfirmationValue(event.target.value)}
            placeholder="Digite CONFIRMAR"
            autoCapitalize="characters"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>

        <button
          type="submit"
          disabled={!canDelete || loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Excluindo conta...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Excluir conta e TODOS os dados atrelados a ela
            </>
          )}
        </button>
      </form>
    </section>
  );
}
