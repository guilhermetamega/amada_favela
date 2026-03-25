import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { X } from "lucide-react";
import { createLostAndFoundItem } from "@/services/supabase/lost_and_found";
import type { LostAndFoundItem } from "@/types/lost_and_found";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (item: LostAndFoundItem) => void;
  communityName: string;
  initialItem?: LostAndFoundItem | null;
};

type FormState = {
  title: string;
  description: string;
  type: "lost" | "found";
  phone: string;
  pic1: File | null;
  pic2: File | null;
  pic3: File | null;
};

const initialForm: FormState = {
  title: "",
  description: "",
  type: "lost",
  phone: "",
  pic1: null,
  pic2: null,
  pic3: null,
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidBrazilPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^(?:[1-9]{2})(?:9\d{8}|\d{8})$/.test(digits);
}

export default function LostAndFoundCreateEditModal({
  open,
  onClose,
  onSaved,
  communityName,
  initialItem,
}: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditMode = !!initialItem;
  const formId = "lost-and-found-create-edit-form";

  useEffect(() => {
    if (!open) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (initialItem) {
      setForm({
        title: initialItem.title,
        description: initialItem.description,
        type: initialItem.type,
        phone: formatPhone(initialItem.phone ?? ""),
        pic1: null,
        pic2: null,
        pic3: null,
      });
      setErrorMessage("");
      return;
    }

    setForm(initialForm);
    setErrorMessage("");
  }, [open, initialItem]);

  const modalTitle = useMemo(
    () => (isEditMode ? "Editar item" : "Novo item"),
    [isEditMode],
  );

  if (!open) return null;

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    if (name === "phone") {
      setForm((prev) => ({
        ...prev,
        phone: formatPhone(value),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, files } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: files?.[0] ?? null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;
    setErrorMessage("");

    if (!communityName.trim()) {
      setErrorMessage("Não foi possível identificar a comunidade do usuário.");
      return;
    }

    if (!form.title.trim()) {
      setErrorMessage("Informe um título.");
      return;
    }

    if (!form.description.trim()) {
      setErrorMessage("Informe uma descrição.");
      return;
    }

    if (!isValidBrazilPhone(form.phone)) {
      setErrorMessage("Informe um telefone válido com DDD.");
      return;
    }

    if (!isEditMode && !form.pic1) {
      setErrorMessage("A imagem principal é obrigatória.");
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        setErrorMessage(
          "O layout de edição está pronto, mas a função de atualização ainda precisa ser conectada no service.",
        );
        return;
      }

      const created = await createLostAndFoundItem({
        title: form.title.trim(),
        community: communityName.trim(),
        description: form.description.trim(),
        type: form.type,
        phone: form.phone.replace(/\D/g, ""),
        pic1: form.pic1 as File,
        pic2: form.pic2,
        pic3: form.pic3,
      });

      onSaved(created);
      setForm(initialForm);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao salvar item.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-70 bg-black/60 backdrop-blur-[1px]
        flex items-end justify-center
        px-3
        pt-14
        pb-[calc(env(safe-area-inset-bottom)+7.5rem)]
        sm:items-center sm:p-4
      "
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="
          flex w-full flex-col overflow-hidden
          rounded-3xl border border-zinc-200 bg-white shadow-2xl
          dark:border-zinc-800 dark:bg-zinc-900
          max-h-[calc(100dvh-10rem-env(safe-area-inset-bottom))]
          sm:max-w-3xl sm:max-h-[92vh]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="mb-3 flex justify-center sm:hidden">
            <span className="h-1.5 w-14 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {modalTitle}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 overscroll-contain">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-500/10">
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Esse item será publicado automaticamente na comunidade do seu
              perfil.
            </p>
          </div>

          <form
            id={formId}
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Título
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none transition focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tipo
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none transition focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-amber-500"
              >
                <option value="lost">Perdido</option>
                <option value="found">Achado</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Telefone de contato
              </label>
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={handleChange}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none transition focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-amber-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Descrição
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Foto principal
              </label>
              <input
                name="pic1"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-amber-500 dark:file:text-white"
                required={!isEditMode}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Foto 2
              </label>
              <input
                name="pic2"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-white dark:file:text-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Foto 3
              </label>
              <input
                name="pic3"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-white dark:file:text-zinc-900"
              />
            </div>
          </form>
        </div>

        <div
          className="
            shrink-0 border-t border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur
            dark:border-zinc-800 dark:bg-zinc-900/95
            pb-[calc(env(safe-area-inset-bottom)+0.75rem)]
            sm:pb-4
          "
        >
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              form={formId}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-500 px-4 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {loading
                ? "Salvando..."
                : isEditMode
                  ? "Salvar alterações"
                  : "Publicar item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
