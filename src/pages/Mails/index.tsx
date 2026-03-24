import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
  getCurrentUserPendingMail,
  markMailAsWithdrawn,
  type MailItem,
} from "@/services/supabase/mail";

type CurrentUserMailProfile = {
  id: string;
  fullname: string;
  address_1: string;
  address_2: string | null;
};

export default function MailsPage() {
  const [profile, setProfile] = useState<CurrentUserMailProfile | null>(null);
  const [mailItems, setMailItems] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingMailId, setUpdatingMailId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMail() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getCurrentUserPendingMail();

        setProfile({
          id: data.profile.id,
          fullname: data.profile.fullname,
          address_1: data.profile.address_1,
          address_2: data.profile.address_2,
        });

        setMailItems(data.items);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar cartas.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    void loadMail();
  }, []);

  async function handleMarkAsWithdrawn(mailId: string) {
    try {
      setUpdatingMailId(mailId);
      setErrorMessage("");

      await markMailAsWithdrawn(mailId);

      setMailItems((prev) => prev.filter((mail) => mail.id !== mailId));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar status da carta.";
      setErrorMessage(message);
    } finally {
      setUpdatingMailId(null);
    }
  }

  return (
    <DashboardLayout>
      <main className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader
            title="Minhas Cartas"
            description="Visualize e confirme o recebimento das suas cartas."
            showBackButton
          />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Carregando cartas...
            </div>
          ) : null}

          {!loading && !errorMessage && profile ? (
            <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-2xl font-bold text-white">
                {profile.fullname}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">{profile.address_1}</p>
              <p className="text-sm text-zinc-400">
                {profile.address_2 || "Sem complemento"}
              </p>
            </section>
          ) : null}

          {!loading && !errorMessage && mailItems.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
              Nenhuma carta pendente no momento.
            </div>
          ) : null}

          {!loading && !errorMessage && mailItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {mailItems.map((mail) => (
                <article
                  key={mail.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {mail.title}
                      </h3>
                      <p className="mt-2 whitespace-pre-line text-sm text-zinc-300">
                        {mail.description}
                      </p>
                      <p className="mt-3 text-sm text-zinc-400">
                        Criada em{" "}
                        {new Date(mail.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Expira em{" "}
                        {new Date(mail.expires_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleMarkAsWithdrawn(mail.id)}
                      disabled={updatingMailId === mail.id}
                      className="rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingMailId === mail.id
                        ? "Atualizando..."
                        : "Notificação Entregue"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
