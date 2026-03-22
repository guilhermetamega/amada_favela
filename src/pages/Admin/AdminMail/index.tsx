import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  createMail,
  getEligibleMailRecipients,
  getUserPendingMail,
  type MailItem,
  type MailRecipient,
} from "@/services/supabase/mail";
import DashboardHeader from "@/components/layout/DashboardHeader";

type CreateMailModalProps = {
  isOpen: boolean;
  recipient: MailRecipient | null;
  onClose: () => void;
  onCreated: (mail: MailItem) => void;
};

function CreateMailModal({
  isOpen,
  recipient,
  onClose,
  onCreated,
}: CreateMailModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !recipient) return null;

  const safeRecipient = recipient;

  function handleClose() {
    if (loading) return;
    setTitle("");
    setDescription("");
    setErrorMessage("");
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setLoading(true);

    try {
      const created = await createMail({
        owner_id: safeRecipient.id,
        fullname: safeRecipient.fullname,
        title,
        description,
      });

      onCreated(created);
      setTitle("");
      setDescription("");
      setErrorMessage("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Nova carta</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Destinatário: {safeRecipient.fullname}
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-zinc-700 px-4 py-3 text-zinc-200 hover:bg-zinc-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Criar carta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMailPage() {
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<MailRecipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] =
    useState<MailRecipient | null>(null);
  const [mailItems, setMailItems] = useState<MailItem[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [loadingMail, setLoadingMail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadRecipients() {
      try {
        setLoadingRecipients(true);
        setErrorMessage("");

        const data = await getEligibleMailRecipients(search);
        setRecipients(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar usuários.";
        setErrorMessage(message);
      } finally {
        setLoadingRecipients(false);
      }
    }

    const timeout = setTimeout(() => {
      void loadRecipients();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  async function handleSelectRecipient(recipient: MailRecipient) {
    try {
      setSelectedRecipient(recipient);
      setLoadingMail(true);
      setErrorMessage("");

      const data = await getUserPendingMail(recipient.id);
      setMailItems(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar cartas.";
      setErrorMessage(message);
    } finally {
      setLoadingMail(false);
    }
  }

  function handleMailCreated(mail: MailItem) {
    setMailItems((prev) => [mail, ...prev]);
  }

  return (
    <DashboardLayout>
      <main className="px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <DashboardHeader
            title="Notificação de Cartas"
            description="Gerencie cartas por usuário da comunidade."
            showBackButton
          />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por nome..."
                className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
              />

              {loadingRecipients ? (
                <p className="text-zinc-300">Carregando usuários...</p>
              ) : recipients.length === 0 ? (
                <p className="text-zinc-400">Nenhum usuário encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {recipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() => void handleSelectRecipient(recipient)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedRecipient?.id === recipient.id
                          ? "border-white bg-zinc-800"
                          : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                      }`}
                    >
                      <h2 className="font-semibold text-white">
                        {recipient.fullname}
                      </h2>
                      <p className="text-sm text-zinc-400">
                        {recipient.address_1}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {recipient.address_2 || "Sem complemento"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              {!selectedRecipient ? (
                <p className="text-zinc-400">
                  Selecione um usuário para visualizar as cartas.
                </p>
              ) : (
                <>
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedRecipient.fullname}
                      </h2>
                      <p className="text-sm text-zinc-400">
                        {selectedRecipient.address_1}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {selectedRecipient.address_2 || "Sem complemento"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900"
                    >
                      Endereçar nova carta
                    </button>
                  </div>

                  {loadingMail ? (
                    <p className="text-zinc-300">Carregando cartas...</p>
                  ) : mailItems.length === 0 ? (
                    <p className="text-zinc-400">
                      Nenhuma carta pendente para este usuário.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {mailItems.map((mail) => (
                        <div
                          key={mail.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-800 p-4"
                        >
                          <h3 className="font-semibold text-white">
                            {mail.title}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            Expira em{" "}
                            {new Date(mail.expires_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <CreateMailModal
        isOpen={isModalOpen}
        recipient={selectedRecipient}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleMailCreated}
      />
    </DashboardLayout>
  );
}
