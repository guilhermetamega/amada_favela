import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  CreditCard,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Upload,
  User,
} from "lucide-react";
import type { AuthMode, LoginFormData, RegisterFormData } from "@/types/auth";
import {
  signInWithIdentifier,
  signUpWithEmail,
} from "@/services/supabase/auth";
import { formatCpf } from "@/utils/cpf";
import developedByLogo from "@/assets/developed_by_logo.png";
import { useAuth } from "@/hooks";
import { supabase } from "@/services/supabase/client";

const initialLoginForm: LoginFormData = {
  identifier: "",
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

function inputClassName() {
  return "w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500/60 focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/20";
}

function labelClassName() {
  return "mb-1 block text-xs font-medium text-zinc-300";
}

function fieldIconClassName(color: string) {
  return `pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${color}`;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRegisterFlow, setIsRegisterFlow] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginFormData>(initialLoginForm);
  const [registerForm, setRegisterForm] =
    useState<RegisterFormData>(initialRegisterForm);

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (user && !isRegisterFlow) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, isRegisterFlow, navigate]);

  useEffect(() => {
    if (!profilePictureFile) {
      setProfilePicturePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(profilePictureFile);
    setProfilePicturePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [profilePictureFile]);

  const registerPhotoHint = useMemo(() => {
    if (!profilePictureFile) {
      return "Selecione uma foto ou tire uma selfie.";
    }

    const sizeInMb = (profilePictureFile.size / (1024 * 1024)).toFixed(2);
    return `${profilePictureFile.name} • ${sizeInMb} MB`;
  }, [profilePictureFile]);

  function handleLoginChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleRegisterChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name === "cpf") {
      const onlyDigits = value.replace(/\D/g, "");

      setRegisterForm((prev) => ({
        ...prev,
        cpf: onlyDigits ? formatCpf(onlyDigits) : "",
      }));
      return;
    }

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleProfilePictureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setProfilePictureFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeInBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Envie uma imagem JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSizeInBytes) {
      setErrorMessage("A foto deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setProfilePictureFile(file);
  }

  function switchToLogin() {
    setMode("login");
    setErrorMessage("");
    setSuccessMessage("");
    setIsRegisterFlow(false);
  }

  function switchToRegister() {
    setMode("register");
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsRegisterFlow(false);
    setLoading(true);

    try {
      await signInWithIdentifier(loginForm);
      navigate("/dashboard", { replace: true });
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
    setIsRegisterFlow(true);

    try {
      await signUpWithEmail(registerForm, profilePictureFile);

      await supabase.auth.signOut();

      setSuccessMessage(
        "Cadastro realizado com sucesso. Faça seu login para continuar.",
      );
      setRegisterForm(initialRegisterForm);
      setLoginForm(initialLoginForm);
      setProfilePictureFile(null);
      setProfilePicturePreview("");
      setMode("login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao realizar cadastro.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setIsRegisterFlow(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-y-auto bg-zinc-950 px-4 py-4 sm:px-6 lg:flex lg:items-center lg:justify-center lg:overflow-hidden lg:py-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute -right-15 top-[15%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-25 left-[20%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl">
        <div
          className={`grid w-full overflow-hidden rounded-4xl border border-zinc-800/80 bg-zinc-900/80 shadow-2xl backdrop-blur-xl lg:max-h-[calc(100vh-2.5rem)] ${
            mode === "register"
              ? "lg:grid-cols-[0.82fr_1.38fr]"
              : "lg:grid-cols-[0.95fr_1.05fr]"
          }`}
        >
          <section className="hidden border-r border-zinc-800/80 bg-linear-to-br from-emerald-500/16 via-zinc-950 to-sky-500/10 p-5 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                <BadgeCheck size={13} />
                Comunidade conectada
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-white">
                AMA da Favela
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-300">
                Serviços da comunidade, avisos importantes e acesso rápido aos
                módulos da plataforma.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
                <p className="text-sm font-semibold text-white">
                  Feito para celular
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Experiência otimizada para smartphone e PWA.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
                <p className="text-sm font-semibold text-white">
                  Acesso simples
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Entre com sua conta ou cadastre-se rapidamente.
                </p>
              </div>
            </div>
          </section>

          <section className="p-4 sm:p-5 lg:p-5">
            <div
              className={`mx-auto w-full ${
                mode === "register" ? "max-w-4xl" : "max-w-md"
              }`}
            >
              <div className="mb-4 lg:mb-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 lg:hidden">
                  <BadgeCheck size={13} />
                  AMA da Favela
                </div>

                <h2 className="mt-3 text-2xl font-bold text-white lg:mt-2">
                  {mode === "login" ? "Entrar na conta" : "Criar sua conta"}
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  {mode === "login"
                    ? "Use seu CPF ou e-mail para acessar."
                    : "Preencha seus dados para continuar."}
                </p>
              </div>

              <div className="mb-4 grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-1 lg:mb-3">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "login"
                      ? "bg-linear-to-r from-emerald-400 to-emerald-600 text-zinc-950 shadow-lg"
                      : "text-zinc-300 hover:bg-zinc-800/80"
                  }`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={switchToRegister}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "register"
                      ? "bg-linear-to-r from-sky-400 to-violet-500 text-white shadow-lg"
                      : "text-zinc-300 hover:bg-zinc-800/80"
                  }`}
                >
                  Cadastro
                </button>
              </div>

              {errorMessage ? (
                <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 lg:mb-2">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mb-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200 lg:mb-2">
                  {successMessage}
                </div>
              ) : null}

              {mode === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label
                      className={labelClassName()}
                      htmlFor="login-identifier"
                    >
                      CPF ou e-mail
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-emerald-300")}>
                        <CreditCard size={16} />
                      </span>
                      <input
                        id="login-identifier"
                        name="identifier"
                        type="text"
                        value={loginForm.identifier}
                        onChange={handleLoginChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="Digite seu CPF ou e-mail"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={labelClassName()}
                      htmlFor="login-password"
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-sky-300")}>
                        <LockKeyhole size={16} />
                      </span>
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="Digite sua senha"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 to-emerald-600 px-4 py-3 font-semibold text-zinc-950 shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                    {!loading ? <ArrowRight size={17} /> : null}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleRegisterSubmit}
                  className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-2.5"
                >
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr] lg:items-center">
                      <div>
                        <label
                          className={labelClassName()}
                          htmlFor="profile-picture"
                        >
                          Foto de perfil
                        </label>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
                              {profilePicturePreview ? (
                                <img
                                  src={profilePicturePreview}
                                  alt="Pré-visualização da foto de perfil"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="text-zinc-500" size={30} />
                              )}
                            </div>

                            <div className="w-full space-y-2">
                              <label
                                htmlFor="profile-picture"
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-800 lg:text-xs"
                              >
                                <Upload size={16} />
                                Selecionar
                              </label>

                              <label
                                htmlFor="profile-picture-camera"
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-800 lg:text-xs"
                              >
                                <Camera size={16} />
                                Tirar foto
                              </label>

                              <p className="line-clamp-2 text-center text-xs text-zinc-400">
                                {registerPhotoHint}
                              </p>
                            </div>
                          </div>

                          <input
                            id="profile-picture"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                          />

                          <input
                            id="profile-picture-camera"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/*"
                            capture="user"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label
                            className={labelClassName()}
                            htmlFor="fullname"
                          >
                            Nome
                          </label>
                          <div className="relative">
                            <span
                              className={fieldIconClassName("text-emerald-300")}
                            >
                              <User size={16} />
                            </span>
                            <input
                              id="fullname"
                              name="fullname"
                              type="text"
                              value={registerForm.fullname}
                              onChange={handleRegisterChange}
                              className={`${inputClassName()} pl-11`}
                              placeholder="Digite seu nome completo"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            className={labelClassName()}
                            htmlFor="register-cpf"
                          >
                            CPF{" "}
                            <span className="text-zinc-500">(opcional)</span>
                          </label>
                          <div className="relative">
                            <span
                              className={fieldIconClassName("text-amber-300")}
                            >
                              <CreditCard size={16} />
                            </span>
                            <input
                              id="register-cpf"
                              name="cpf"
                              type="text"
                              inputMode="numeric"
                              maxLength={14}
                              value={registerForm.cpf}
                              onChange={handleRegisterChange}
                              className={`${inputClassName()} pl-11`}
                              placeholder="000.000.000-00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName()} htmlFor="birth">
                      Data de nascimento
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-violet-300")}>
                        <CalendarDays size={16} />
                      </span>
                      <input
                        id="birth"
                        name="birth"
                        type="date"
                        value={registerForm.birth}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName()} htmlFor="email">
                      E-mail
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-sky-300")}>
                        <Mail size={16} />
                      </span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="voce@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName()} htmlFor="phone">
                      Telefone
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-emerald-300")}>
                        <Phone size={16} />
                      </span>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        required
                        value={registerForm.phone}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName()} htmlFor="comunity">
                      Comunidade
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-rose-300")}>
                        <MapPin size={16} />
                      </span>
                      <input
                        id="comunity"
                        name="comunity"
                        type="text"
                        required
                        value={registerForm.comunity}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="Informe sua comunidade"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName()} htmlFor="address_1">
                      Endereço principal
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-sky-300")}>
                        <MapPin size={16} />
                      </span>
                      <input
                        id="address_1"
                        name="address_1"
                        type="text"
                        value={registerForm.address_1}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="Rua, número"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName()} htmlFor="address_2">
                      Complemento
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-cyan-300")}>
                        <MapPin size={16} />
                      </span>
                      <input
                        id="address_2"
                        name="address_2"
                        type="text"
                        value={registerForm.address_2}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="Bloco, casa, referência"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={labelClassName()}
                      htmlFor="register-password"
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-violet-300")}>
                        <LockKeyhole size={16} />
                      </span>
                      <input
                        id="register-password"
                        name="password"
                        type="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="Crie sua senha"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={labelClassName()}
                      htmlFor="confirmPassword"
                    >
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <span className={fieldIconClassName("text-violet-300")}>
                        <LockKeyhole size={16} />
                      </span>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        className={`${inputClassName()} pl-11`}
                        placeholder="Repita sua senha"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-1 lg:pt-0">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-violet-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Cadastrando..." : "Criar conta"}
                      {!loading ? <ArrowRight size={17} /> : null}
                    </button>
                  </div>
                </form>
              )}

              <footer className="mt-4 border-t border-zinc-800/80 pt-4 text-center lg:mt-3 lg:pt-3">
                <p className="text-xs text-zinc-400">
                  Desenvolvido Pela Equipe das:
                </p>

                <div className="mt-2 flex justify-center">
                  <img
                    src={developedByLogo}
                    alt="Equipe de Desenvolvimento"
                    className="h-10 object-contain opacity-85 transition hover:opacity-100"
                  />
                </div>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
