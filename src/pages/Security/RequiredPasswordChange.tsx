import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getPasswordRequirementState,
  isBasePasswordPolicyValid,
} from "@/lib/password-policy";
import { changeRequiredPassword } from "@/services/supabase/access";

type RequirementItemProps = {
  valid: boolean;
  label: string;
};

function RequirementItem({ valid, label }: RequirementItemProps) {
  return (
    <li
      className={[
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        valid
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          valid
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-zinc-300 dark:border-zinc-600",
        ].join(" ")}
      >
        {valid ? <Check size={13} strokeWidth={3} /> : null}
      </span>

      {label}
    </li>
  );
}

export default function RequiredPasswordChangePage() {
  const navigate = useNavigate();

  const {
    loading: permissionsLoading,
    passwordChangeRequired,
    refreshPermissions,
  } = usePermissions();

  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const requirements = useMemo(
    () => getPasswordRequirementState(newPassword),
    [newPassword],
  );

  const passwordsMatch =
    passwordConfirmation.length > 0 && newPassword === passwordConfirmation;

  const canSubmit =
    isBasePasswordPolicyValid(newPassword) && passwordsMatch && !submitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await changeRequiredPassword(newPassword);
      await refreshPermissions();

      setSuccessMessage("Senha atualizada. Seu acesso foi liberado.");

      await new Promise((resolve) => window.setTimeout(resolve, 500));

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar sua senha.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!permissionsLoading && !passwordChangeRequired && !successMessage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-5xl">
          <DashboardHeader
            title="Crie uma nova senha"
            description="Por segurança, a senha temporária precisa ser substituída antes de continuar."
          />

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="overflow-hidden rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-cyan-950/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <ShieldCheck size={28} />
              </div>

              <h2 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Proteção da sua conta
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Esta etapa aparece quando uma senha temporária foi definida
                presencialmente pela associação. Depois da alteração, somente
                você conhecerá a nova senha.
              </p>

              <div className="mt-6 rounded-2xl border border-emerald-200/70 bg-white/80 p-4 dark:border-emerald-500/20 dark:bg-zinc-950/40">
                <div className="flex items-start gap-3">
                  <KeyRound
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />

                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      A senha temporária deixará de funcionar
                    </p>

                    <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
                      Use uma senha exclusiva e que não seja utilizada em outros
                      aplicativos.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
              {errorMessage ? (
                <div
                  role="alert"
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                >
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  {successMessage}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    Nova senha
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      autoFocus
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 pr-12 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      placeholder="Digite uma senha segura"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <ul className="grid gap-2 sm:grid-cols-2">
                  <RequirementItem
                    valid={requirements.hasMinimumLength}
                    label="Pelo menos 8 caracteres"
                  />

                  <RequirementItem
                    valid={requirements.hasUppercase}
                    label="Uma letra maiúscula"
                  />

                  <RequirementItem
                    valid={requirements.hasLowercase}
                    label="Uma letra minúscula"
                  />

                  <RequirementItem
                    valid={requirements.hasNumber}
                    label="Pelo menos um número"
                  />

                  <RequirementItem
                    valid={requirements.hasNoOuterSpaces}
                    label="Sem espaços nas extremidades"
                  />
                </ul>

                <div>
                  <label
                    htmlFor="password-confirmation"
                    className="mb-2 block text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    Confirme a nova senha
                  </label>

                  <div className="relative">
                    <input
                      id="password-confirmation"
                      type={showPasswordConfirmation ? "text" : "password"}
                      value={passwordConfirmation}
                      onChange={(event) =>
                        setPasswordConfirmation(event.target.value)
                      }
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 pr-12 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      placeholder="Digite a senha novamente"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordConfirmation((current) => !current)
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                      aria-label={
                        showPasswordConfirmation
                          ? "Ocultar confirmação"
                          : "Mostrar confirmação"
                      }
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>

                  {passwordConfirmation.length > 0 ? (
                    <p
                      className={[
                        "mt-2 text-sm",
                        passwordsMatch
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                      ].join(" ")}
                    >
                      {passwordsMatch
                        ? "As senhas são iguais."
                        : "As senhas ainda não coincidem."}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={19} className="animate-spin" />
                      Atualizando senha...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={19} />
                      Salvar nova senha
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
