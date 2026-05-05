import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
  createSocialProjectItem,
  deleteSocialProjectItem,
  getAdminSocialProjectsItems,
  updateSocialProjectItem,
} from "@/services/supabase/social_projects";
import type { SocialProjectItem } from "@/types/social_projects";
import MainLayout from "@/components/layout/MainLayout";

type FormState = {
  title: string;
  description: string;
  contact_phone: string;
  address: string;
  pix_key: string;
  volunteer_info: string;
  status: "active" | "inactive";
  pic1: File | null;
  pic2: File | null;
  pic3: File | null;
};

const initialForm: FormState = {
  title: "",
  description: "",
  contact_phone: "",
  address: "",
  pix_key: "",
  volunteer_info: "",
  status: "active",
  pic1: null,
  pic2: null,
  pic3: null,
};

export default function AdminSocialProjectsPage() {
  const [items, setItems] = useState<SocialProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingItem, setEditingItem] = useState<SocialProjectItem | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    async function loadItems() {
      try {
        setLoading(true);
        setErrorMessage("");
        const data = await getAdminSocialProjectsItems();
        setItems(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar projetos.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    void loadItems();
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      ),
    [items],
  );

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

  function handleStartEdit(item: SocialProjectItem) {
    setEditingItem(item);
    setSuccessMessage("");
    setErrorMessage("");
    setForm({
      title: item.title,
      description: item.description,
      contact_phone: item.contact_phone,
      address: item.address ?? "",
      pix_key: item.pix_key ?? "",
      volunteer_info: item.volunteer_info ?? "",
      status: item.status,
      pic1: null,
      pic2: null,
      pic3: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingItem(null);
    setForm(initialForm);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!editingItem && !form.pic1) {
      setErrorMessage("A imagem principal é obrigatória.");
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        const updated = await updateSocialProjectItem(editingItem.id, {
          title: form.title,
          description: form.description,
          contact_phone: form.contact_phone,
          address: form.address,
          pix_key: form.pix_key,
          volunteer_info: form.volunteer_info,
          status: form.status,
          pic1: form.pic1,
          pic2: form.pic2,
          pic3: form.pic3,
        });

        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );

        setSuccessMessage("Projeto social atualizado com sucesso.");
        setEditingItem(null);
        setForm(initialForm);
        return;
      }

      const created = await createSocialProjectItem({
        title: form.title,
        description: form.description,
        contact_phone: form.contact_phone,
        address: form.address,
        pix_key: form.pix_key,
        volunteer_info: form.volunteer_info,
        status: form.status,
        pic1: form.pic1 as File,
        pic2: form.pic2,
        pic3: form.pic3,
      });

      setItems((prev) => [created, ...prev]);
      setForm(initialForm);
      setSuccessMessage("Projeto social criado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar projeto.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este projeto social?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      await deleteSocialProjectItem(id);

      setItems((prev) => prev.filter((item) => item.id !== id));

      if (editingItem?.id === id) {
        setEditingItem(null);
        setForm(initialForm);
      }

      setSuccessMessage("Projeto social excluído com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao excluir projeto.";
      setErrorMessage(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl">
          <DashboardHeader title="Projetos Sociais" />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                {editingItem ? "Editar projeto" : "Novo projeto social"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="title"
                  >
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
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="volunteer_info"
                  >
                    Como ajudar / voluntariado
                  </label>
                  <textarea
                    id="volunteer_info"
                    name="volunteer_info"
                    value={form.volunteer_info}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="contact_phone"
                  >
                    Telefone de contato
                  </label>
                  <input
                    id="contact_phone"
                    name="contact_phone"
                    type="text"
                    value={form.contact_phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
                    required
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="address"
                  >
                    Endereço
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="pix_key"
                  >
                    Chave PIX
                  </label>
                  <input
                    id="pix_key"
                    name="pix_key"
                    type="text"
                    value={form.pix_key}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="pic1"
                  >
                    Imagem principal
                  </label>
                  <input
                    id="pic1"
                    name="pic1"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-zinc-900"
                    required={!editingItem}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="pic2"
                  >
                    Imagem 2
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
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="pic3"
                  >
                    Imagem 3
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

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-white px-5 py-3 font-semibold text-zinc-900 disabled:opacity-60"
                  >
                    {saving
                      ? "Salvando..."
                      : editingItem
                        ? "Salvar alterações"
                        : "Criar projeto"}
                  </button>

                  {editingItem ? (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-xl border border-zinc-700 px-5 py-3 font-medium text-zinc-200"
                    >
                      Cancelar edição
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Projetos cadastrados
              </h2>

              {loading ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
                  Carregando projetos...
                </div>
              ) : null}

              {!loading && sortedItems.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
                  Nenhum projeto cadastrado.
                </div>
              ) : null}

              {!loading && sortedItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {sortedItems.map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-zinc-800">
                        <img
                          src={item.pic_1_url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {item.title}
                          </h3>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              item.status === "active"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-zinc-700 text-zinc-300"
                            }`}
                          >
                            {item.status === "active" ? "Ativo" : "Inativo"}
                          </span>
                        </div>

                        <p className="line-clamp-3 text-sm text-zinc-400">
                          {item.description}
                        </p>

                        <div className="space-y-1 text-sm text-zinc-500">
                          <p>Comunidade: {item.community}</p>
                          <p>Contato: {item.contact_phone}</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                          >
                            {deletingId === item.id
                              ? "Excluindo..."
                              : "Excluir"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
