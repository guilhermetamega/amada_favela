import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, MailPlus, X } from "lucide-react";
import {
  createMail,
  type MailItem,
  type MailRecipient,
} from "@/services/supabase/mail";

type CreateMailModalProps = {
  isOpen: boolean;
  recipient: MailRecipient | null;
  onClose: () => void;
  onCreated: (mail: MailItem) => void;
};

export default function CreateMailModal({
  isOpen,
  recipient,
  onClose,
  onCreated,
}: CreateMailModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setErrorMessage("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !recipient) return null;

  function handleClose() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || !recipient) return;

    setErrorMessage("");
    setLoading(true);

    try {
      const created = await createMail({
        owner_id: recipient.id,
        fullname: recipient.fullname,
        title: title.trim(),
        description: description.trim(),
      });

      onCreated(created);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar carta.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
        <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative border-b border-zinc-200 px-4 py-5 dark:border-zinc-800 sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>

            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
                Nova carta
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Destinatário: {recipient.fullname}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                {errorMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  htmlFor="title"
                >
                  Título
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  htmlFor="description"
                >
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
                  required
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <MailPlus size={16} />
                  )}
                  {loading ? "Salvando..." : "Criar carta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
