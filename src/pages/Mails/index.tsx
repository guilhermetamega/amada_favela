import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import {
  getCurrentUserPendingMail,
  markMailAsWithdrawn,
  type MailItem,
} from "@/services/supabase/mail";
import MainLayout from "@/components/layout/MainLayout";
import {
  HeartHandshake,
  CalendarDays,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MailsPage() {
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

  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-5xl space-y-4 px-1 sm:space-y-5">
          <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-linear-to-br from-emerald-100 via-sky-100 to-pink-100 p-4 shadow-lg dark:border-zinc-800/80 dark:from-emerald-500/10 dark:via-sky-500/10 dark:to-pink-500/10 sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-pink-400/25 blur-3xl" />

            <h1 className=" text-2xl font-black text-zinc-900 dark:text-white sm:text-3xl">
              Minhas Cartas
            </h1>
          </section>

          {errorMessage && (
            <div className="mt-6 flex flex-col gap-3">
              <div className="rounded-3xl border border-red-300 bg-red-50 p-4 text-red-700 dark:bg-red-500/10 dark:text-red-300">
                {errorMessage}
              </div>

              <button
                type="button"
                onClick={() => navigate("/profile#partner-section")}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-amber-300/80 bg-linear-to-r from-amber-300 via-yellow-300 to-orange-300 px-4 py-3 text-sm font-semibold text-amber-950 shadow-[0_12px_30px_rgba(251,191,36,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(251,191,36,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 dark:border-amber-300/20 dark:from-amber-300 dark:via-yellow-200 dark:to-orange-200 dark:text-amber-950 sm:min-w-55 sm:w-auto"
              >
                <span className="pointer-events-none absolute inset-y-0 left-[-30%] w-1/3 -skew-x-12 bg-white/25 blur-md transition-transform duration-700 group-hover:translate-x-[330%]" />
                <span className="pointer-events-none absolute right-3 top-2 text-amber-800/80">
                  <Sparkles size={12} className="animate-pulse" />
                </span>
                <CreditCard size={16} />
                Quero Virar Sócio
              </button>
            </div>
          )}

          {loading && (
            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-300">
              Carregando cartas...
            </div>
          )}

          {!loading && mailItems.length === 0 && (
            <section className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-linear-to-br from-emerald-100 via-sky-100 to-pink-100 p-6 text-center shadow-lg dark:border-zinc-800 dark:from-emerald-500/10 dark:via-sky-500/10 dark:to-pink-500/10">
              <div className="absolute inset-0 animate-[ping_8s_cubic-bezier(0,0,0.2,1)_infinite] bg-pink-300/20 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center">
                <HeartHandshake className="h-12 w-12 text-pink-500 mb-4" />

                <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                  Nenhuma carta por enquanto
                </h3>

                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Assim que novas cartas chegarem, elas vão aparecer aqui com um
                  visual bonito e organizado.
                </p>

                <div className="mt-4 flex gap-2">
                  <span className="h-2 w-2 animate-bounce bg-emerald-400 rounded-full" />
                  <span className="h-2 w-2 animate-bounce bg-sky-400 rounded-full delay-100" />
                  <span className="h-2 w-2 animate-bounce bg-pink-400 rounded-full delay-200" />
                </div>
              </div>
            </section>
          )}

          {mailItems.length > 0 && (
            <div className="grid gap-4">
              {mailItems.map((mail) => (
                <article
                  key={mail.id}
                  className="rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                        {mail.title}
                      </h3>

                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {mail.description}
                      </p>

                      <div className="mt-3 text-xs text-zinc-500 space-y-1">
                        <p className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Criada em{" "}
                          {new Date(mail.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>

                        <p>
                          Expira em{" "}
                          {new Date(mail.expires_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkAsWithdrawn(mail.id)}
                      disabled={updatingMailId === mail.id}
                      className="rounded-2xl bg-linear-to-r from-emerald-500 to-green-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95"
                    >
                      {updatingMailId === mail.id
                        ? "Atualizando..."
                        : "Marcar como entregue"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
