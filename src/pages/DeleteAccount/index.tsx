import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestAccountDeletion } from "@/services/supabase/account_deletion";

// Ajuste estes imports para os mesmos usados no Auth atual
import logo from "@/assets/developed_by_logo.png";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (!digits) return "";

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/^(\d{3})(\d+)/, "$1.$2");
  if (digits.length <= 9) {
    return digits.replace(/^(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }

  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
}

function formatDateInput(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (!digits) return "";

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.replace(/^(\d{2})(\d+)/, "$1/$2");

  return digits.replace(/^(\d{2})(\d{2})(\d{1,4}).*/, "$1/$2/$3");
}

function isValidBirthDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const [day, month, year] = value.split("/").map(Number);

  if (!day || !month || !year) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900) return false;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const now = new Date();

  if (date > now) return false;

  return true;
}

export default function DeleteAccountPage() {
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canSubmit = useMemo(() => {
    return (
      onlyDigits(cpf).length === 11 &&
      isValidBirthDate(birthDate) &&
      confirmation.trim().toUpperCase() === "CONFIRMAR" &&
      confirmChecked
    );
  }, [cpf, birthDate, confirmation, confirmChecked]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (onlyDigits(cpf).length !== 11) {
      setErrorMessage("Informe um CPF válido.");
      return;
    }

    if (!isValidBirthDate(birthDate)) {
      setErrorMessage("Informe uma data de nascimento válida.");
      return;
    }

    if (confirmation.trim().toUpperCase() !== "CONFIRMAR") {
      setErrorMessage('Digite exatamente "CONFIRMAR" para continuar.');
      return;
    }

    if (!confirmChecked) {
      setErrorMessage(
        "Você precisa confirmar que entendeu a exclusão da conta e de todo o conteúdo relacionado.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await requestAccountDeletion({
        cpf,
        birthDate,
        confirmation,
      });

      setSuccessMessage(response.message);
      setCpf("");
      setBirthDate("");
      setConfirmation("");
      setConfirmChecked(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-4xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative hidden overflow-hidden bg-zinc-900 p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-8 right-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                  <img
                    src={logo}
                    alt="Logo da plataforma"
                    className="h-full w-full object-contain p-2"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    Exclusão de conta
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold">AMA da Favela</h1>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <p className="max-w-md text-sm leading-6 text-white/80">
                  Plataforma desenvolvida pelo{" "}
                  <strong>time das lojas das comunidades</strong>, com foco em
                  acesso, organização comunitária e serviços digitais.
                </p>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <h2 className="text-lg font-semibold">O que será excluído</h2>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/80">
                    <p>
                      Ao solicitar a exclusão, você está pedindo a remoção da
                      sua
                      <strong> conta</strong> e de{" "}
                      <strong>
                        todo o conteúdo criado ou relacionado a ela
                      </strong>
                      .
                    </p>
                    <p>
                      Isso inclui dados de perfil, anúncios, publicações,
                      registros, histórico e demais informações vinculadas ao
                      seu cadastro na plataforma.
                    </p>
                    <p>
                      A solicitação será analisada e concluída manualmente em
                      até
                      <strong> 7 dias</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-10 text-xs text-white/60">
              Alguns dados poderão ser mantidos apenas quando houver obrigação
              legal, conforme nossos Termos de Uso e Política de Privacidade.
            </div>
          </section>

          <section className="p-5 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-8 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <img
                      src={logo}
                      alt="Logo da plataforma"
                      className="h-full w-full object-contain p-2"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Solicitação de exclusão
                    </p>
                    <h1 className="text-xl font-semibold">AMA da Favela</h1>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Desenvolvido pelo{" "}
                  <strong>time das lojas das comunidades</strong>. Esta
                  solicitação remove a conta e todo o conteúdo criado ou
                  relacionado a ela, com processamento manual em até 7 dias.
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  Solicitar exclusão de conta
                </h2>
              </div>

              {errorMessage ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {successMessage}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="cpf"
                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    CPF
                  </label>
                  <input
                    id="cpf"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(event) => setCpf(formatCpf(event.target.value))}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="birthDate"
                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Data de nascimento
                  </label>
                  <input
                    id="birthDate"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="DD/MM/AAAA"
                    value={birthDate}
                    onChange={(event) =>
                      setBirthDate(formatDateInput(event.target.value))
                    }
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmation"
                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Digite CONFIRMAR
                  </label>
                  <input
                    id="confirmation"
                    type="text"
                    autoComplete="off"
                    placeholder="CONFIRMAR"
                    value={confirmation}
                    onChange={(event) =>
                      setConfirmation(event.target.value.toUpperCase())
                    }
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500"
                    required
                  />
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(event) =>
                      setConfirmChecked(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <span className="leading-6">
                    Confirmo que entendo que esta solicitação pede a exclusão da
                    minha conta e de
                    <strong>
                      {" "}
                      todo o conteúdo criado ou relacionado a ela
                    </strong>
                    , com processamento manual em até 7 dias.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3.5 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                >
                  {loading ? "Enviando solicitação..." : "Solicitar exclusão"}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Link
                  to="/terms"
                  className="underline underline-offset-4 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Termos de Uso
                </Link>
                <Link
                  to="/privacy"
                  className="underline underline-offset-4 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Política de Privacidade
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
