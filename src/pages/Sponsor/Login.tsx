import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { sponsorLogin } from "@/services/supabase/sponsor_auth";
import {
  setSponsorProfile,
  setSponsorSessionToken,
} from "@/lib/sponsorSession";
import type { SponsorLoginError } from "@/types/sponsors";

export default function SponsorLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [birth, setBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [expiredData, setExpiredData] = useState<SponsorLoginError | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await sponsorLogin(email, birth);

      if (!response) {
        setErrorMessage("Não foi possível concluir o acesso.");
        return;
      }

      if (!response.ok) {
        if (response.code === "expired") {
          setExpiredData(response);
          return;
        }

        setErrorMessage("Email ou data de nascimento inválidos.");
        return;
      }

      setSponsorSessionToken(response.token);
      setSponsorProfile({
        sponsor: response.sponsor,
        features: response.features,
      });

      navigate("/sponsor", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao acessar a área do patrocinador.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="max-w-lg">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Área do patrocinador
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Acesso rápido e objetivo
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Entre com seu email e data de nascimento para acessar apenas as
                funções liberadas para o seu perfil.
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  htmlFor="birth"
                >
                  Data de nascimento
                </label>
                <input
                  id="birth"
                  type="date"
                  value={birth}
                  onChange={(event) => setBirth(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {expiredData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Acesso expirado</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {expiredData.sponsor_name
                ? `${expiredData.sponsor_name}, seu acesso de patrocinador expirou.`
                : "Seu acesso de patrocinador expirou."}
            </p>
            {expiredData.expires_at ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Validade encerrada em{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(expiredData.expires_at))}
                .
              </p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setExpiredData(null)}
                className="rounded-2xl border border-zinc-200 px-4 py-2 font-medium dark:border-zinc-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
