import { useState, type ChangeEvent, type FormEvent } from "react";
import { createLostAndFoundItem } from "@/services/supabase/lost_and_found";
import type { LostAndFoundItem } from "@/types/lost_and_found";

type CreateLostAndFoundModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: LostAndFoundItem) => void;
};

type FormState = {
  title: string;
  community: string;
  description: string;
  type: "lost" | "found";
  phone: string;
  pic1: File | null;
  pic2: File | null;
  pic3: File | null;
};

const initialForm: FormState = {
  title: "",
  community: "",
  description: "",
  type: "lost",
  phone: "",
  pic1: null,
  pic2: null,
  pic3: null,
};

export default function CreateLostAndFoundModal({
  isOpen,
  onClose,
  onCreated,
}: CreateLostAndFoundModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

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

    if (!form.pic1) {
      setErrorMessage("A primeira imagem é obrigatória.");
      return;
    }

    setLoading(true);

    try {
      const createdItem = await createLostAndFoundItem({
        title: form.title,
        community: form.community,
        description: form.description,
        type: form.type,
        phone: form.phone,
        pic1: form.pic1,
        pic2: form.pic2,
        pic3: form.pic3,
      });

      onCreated(createdItem);
      setForm(initialForm);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cadastrar item.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Novo item</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Cadastre um item achado ou perdido.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-zinc-300" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300" htmlFor="type">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
            >
              <option value="lost">Perdido</option>
              <option value="found">Achado</option>
            </select>
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-zinc-300"
              htmlFor="community"
            >
              Comunidade
            </label>
            <input
              id="community"
              name="community"
              type="text"
              value={form.community}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="mb-1 block text-sm text-zinc-300"
              htmlFor="description"
            >
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div className="hidden md:block" />

          <div>
            <label className="mb-1 block text-sm text-zinc-300" htmlFor="pic1">
              Foto 1
            </label>
            <input
              id="pic1"
              name="pic1"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-zinc-900"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300" htmlFor="pic2">
              Foto 2
            </label>
            <input
              id="pic2"
              name="pic2"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300" htmlFor="pic3">
              Foto 3
            </label>
            <input
              id="pic3"
              name="pic3"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-zinc-900"
            />
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-4 py-3 font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Cadastrar item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
