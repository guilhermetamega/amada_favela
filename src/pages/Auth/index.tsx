import { useState, type ChangeEvent, type FormEvent } from "react";
import type { AuthMode, LoginFormData, RegisterFormData } from "@/types/auth";
import { signInWithCpf, signUpWithEmail } from "@/services/supabase/auth";
import { formatCpf } from "@/utils/cpf";

const initialLoginForm: LoginFormData = {
  cpf: "",
  password: "",
};

const initialRegisterForm: RegisterFormData = {
  fullname: "",
  cpf: "",
  birth: "",
  address_1: "",
  address_2: "",
  comunity: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loginForm, setLoginForm] = useState<LoginFormData>(initialLoginForm);
  const [registerForm, setRegisterForm] =
    useState<RegisterFormData>(initialRegisterForm);

  function handleLoginChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name === "cpf") {
      setLoginForm((prev) => ({
        ...prev,
        cpf: formatCpf(value),
      }));
      return;
    }

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleRegisterChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await signInWithCpf(loginForm);
      setSuccessMessage("Login realizado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao realizar login.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(registerForm);
      setSuccessMessage(
        "Cadastro realizado com sucesso. Verifique seu e-mail para confirmar a conta, se necessário.",
      );
      setRegisterForm(initialRegisterForm);
      setMode("login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao realizar cadastro.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">AMA da Favela</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Entre na sua conta ou crie seu cadastro.
          </p>
        </div>

        <div className="mb-6 flex w-full rounded-xl bg-zinc-800 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-zinc-900"
                : "text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-white text-zinc-900"
                : "text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Cadastro
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400" htmlFor="cpf">
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={loginForm.cpf}
                onChange={handleLoginChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleRegisterSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="fullname"
              >
                Nome completo
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                value={registerForm.fullname}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300" htmlFor="cpf">
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                value={registerForm.cpf}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                required
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="birth"
              >
                Data de nascimento
              </label>
              <input
                id="birth"
                name="birth"
                type="date"
                value={registerForm.birth}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="address_1"
              >
                Endereço principal
              </label>
              <input
                id="address_1"
                name="address_1"
                type="text"
                value={registerForm.address_1}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                required
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="address_2"
              >
                Complemento
              </label>
              <input
                id="address_2"
                name="address_2"
                type="text"
                value={registerForm.address_2}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="comunity"
              >
                Comunidade
              </label>
              <input
                id="comunity"
                name="comunity"
                type="text"
                value={registerForm.comunity}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="phone"
              >
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={registerForm.phone}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                required
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                required
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-zinc-300"
                htmlFor="confirmPassword"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Cadastrando..." : "Criar conta"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
