import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { COMMUNITIES } from "@/lib/communities";
import { prefetchDashboard } from "@/lib/prefetch/prefetch-dashboard";
import LegalModal from "@/components/legal/LegalModal";

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
  zipcode: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function inputClassName() {
  return "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-white dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900";
}

function labelClassName() {
  return "mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300";
}

function fieldIconClassName(color: string) {
  return `pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${color}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatZipcode(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
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

  const [legalModalType, setLegalModalType] = useState<
    "privacy" | "terms" | null
  >(null);

  function openPrivacyModal() {
    setLegalModalType("privacy");
  }

  function openTermsModal() {
    setLegalModalType("terms");
  }

  function closeLegalModal() {
    setLegalModalType(null);
  }

  const activeCommunities = useMemo(
    () => COMMUNITIES.filter((community) => community.active),
    [],
  );

  const selectedCommunity = useMemo(
    () =>
      activeCommunities.find(
        (community) => community.key === registerForm.comunity,
      ) ?? null,
    [activeCommunities, registerForm.comunity],
  );

  const communityAddressItems = useMemo(
    () => selectedCommunity?.addressItems ?? [],
    [selectedCommunity],
  );

  const communityZipcodes = useMemo(
    () => selectedCommunity?.zipcodes ?? [],
    [selectedCommunity],
  );

  const hasPresetAddressItems = communityAddressItems.length > 0;
  const hasPresetZipcodes = communityZipcodes.length > 0;

  const address1Label = useMemo(() => {
    if (!selectedCommunity) {
      return "Rua / Quadra";
    }

    const hasStreet = communityAddressItems.some(
      (item) => item.type === "street",
    );
    const hasBlock = communityAddressItems.some(
      (item) => item.type === "block",
    );

    if (hasStreet && hasBlock) return "Rua / Quadra";
    if (hasStreet) return "Rua";
    if (hasBlock) return "Quadra";

    return "Rua / Quadra";
  }, [selectedCommunity, communityAddressItems]);

  const address1Placeholder = useMemo(() => {
    if (!selectedCommunity) {
      return "Digite sua rua ou quadra";
    }

    const hasStreet = communityAddressItems.some(
      (item) => item.type === "street",
    );
    const hasBlock = communityAddressItems.some(
      (item) => item.type === "block",
    );

    if (hasStreet && hasBlock) return "Selecione ou digite sua rua/quadra";
    if (hasStreet) return "Digite sua rua";
    if (hasBlock) return "Digite sua quadra";

    return "Digite sua rua ou quadra";
  }, [selectedCommunity, communityAddressItems]);

  const cardGridClassName =
    mode === "register"
      ? "lg:grid-cols-[0.82fr_1.38fr]"
      : "lg:grid-cols-[0.95fr_1.05fr]";

  const formWrapperClassName = mode === "register" ? "max-w-4xl" : "max-w-md";

  useEffect(() => {
    if (authLoading) return;

    if (user && !isRegisterFlow) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, isRegisterFlow, navigate]);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) return;

      const hasSession = !!data.session;

      if (!hasSession) return;

      const {
        data: { user: sessionUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !sessionUser) {
        await supabase.auth.signOut();
      }
    });
  }, []);

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

  function handleRegisterChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    if (name === "cpf") {
      const onlyDigits = value.replace(/\D/g, "");

      setRegisterForm((prev) => ({
        ...prev,
        cpf: onlyDigits ? formatCpf(onlyDigits) : "",
      }));
      return;
    }

    if (name === "phone") {
      setRegisterForm((prev) => ({
        ...prev,
        phone: formatPhone(value),
      }));
      return;
    }

    if (name === "zipcode") {
      setRegisterForm((prev) => ({
        ...prev,
        zipcode: formatZipcode(value),
      }));
      return;
    }

    if (name === "comunity") {
      const nextCommunity =
        COMMUNITIES.find(
          (community) => community.key === value && community.active,
        ) ?? null;

      const nextZipcodes = nextCommunity?.zipcodes ?? [];
      const nextZipcode = nextZipcodes.length === 1 ? nextZipcodes[0] : "";

      setRegisterForm((prev) => ({
        ...prev,
        comunity: value,
        zipcode: nextZipcode,
        address_1: "",
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

  function resetAuthMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function switchToLogin() {
    setMode("login");
    resetAuthMessages();
    setIsRegisterFlow(false);
  }

  function switchToRegister() {
    setMode("register");
    resetAuthMessages();
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    resetAuthMessages();
    setIsRegisterFlow(false);
    setLoading(true);

    try {
      await signInWithIdentifier(loginForm);

      void prefetchDashboard();

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

    resetAuthMessages();

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    if (!registerForm.comunity) {
      setErrorMessage("Selecione sua comunidade.");
      return;
    }

    if (!registerForm.zipcode) {
      setErrorMessage("Informe o CEP.");
      return;
    }

    if (!registerForm.address_1) {
      setErrorMessage(`Informe ${address1Label.toLowerCase()}.`);
      return;
    }

    setLoading(true);
    setIsRegisterFlow(true);

    try {
      await signUpWithEmail(registerForm, profilePictureFile);
      void prefetchDashboard();

      setRegisterForm(initialRegisterForm);
      setLoginForm(initialLoginForm);
      setProfilePictureFile(null);
      setProfilePicturePreview("");
      setMode("login");
      setSuccessMessage(
        "Cadastro realizado com sucesso. Agora entre com sua conta.",
      );
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
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/12" />
        <div className="absolute -right-16 top-[15%] h-72 w-72 rounded-full bg-sky-500/8 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute -bottom-16 left-[20%] h-72 w-72 rounded-full bg-violet-500/8 blur-3xl dark:bg-violet-500/10" />
        <div className="absolute bottom-[10%] right-[10%] h-56 w-56 rounded-full bg-amber-500/8 blur-3xl dark:bg-amber-500/10" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-4 sm:px-6 lg:py-5">
        <div className="w-full max-w-6xl">
          <div
            className={`grid w-full overflow-hidden rounded-4xl border border-zinc-200/80 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80 ${cardGridClassName}`}
          >
            <section className="hidden border-r border-zinc-200/80 bg-linear-to-br from-emerald-500/10 via-white to-sky-500/8 p-5 dark:border-zinc-800/80 dark:from-emerald-500/16 dark:via-zinc-950 dark:to-sky-500/10 lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  <BadgeCheck size={13} />
                  Comunidade conectada
                </div>

                <h1 className="mt-4 text-3xl font-bold leading-tight text-zinc-900 dark:text-white">
                  AMA da Favela
                </h1>

                <p className="mt-3 w-full text-center text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Serviços da comunidade, avisos importantes e acesso rápido aos
                  módulos da plataforma.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/60">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Feito para celular
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Experiência otimizada para smartphone.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/60">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Acesso simples
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Entre com sua conta ou cadastre-se rapidamente.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-4 sm:p-5 lg:p-5">
              <div className={`mx-auto w-full ${formWrapperClassName}`}>
                <div className="mb-4 lg:mb-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 lg:hidden">
                    <BadgeCheck size={13} />
                    AMA da Favela
                  </div>

                  <h2 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white lg:mt-2">
                    {mode === "login" ? "Entrar na conta" : "Criar sua conta"}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {mode === "login"
                      ? "Use seu CPF ou e-mail para acessar."
                      : "Preencha seus dados para continuar."}
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-2 rounded-2xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-950/70 lg:mb-3">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      mode === "login"
                        ? "bg-linear-to-r from-emerald-400 to-emerald-600 text-zinc-950 shadow-lg"
                        : "text-zinc-700 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800/80"
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
                        : "text-zinc-700 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    Cadastro
                  </button>
                </div>

                {errorMessage ? (
                  <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-200 lg:mb-2">
                    {errorMessage}
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="mb-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-200 lg:mb-2">
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
                        <span
                          className={fieldIconClassName(
                            "text-emerald-600 dark:text-emerald-300",
                          )}
                        >
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
                        <span
                          className={fieldIconClassName(
                            "text-sky-600 dark:text-sky-300",
                          )}
                        >
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

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                {profilePicturePreview ? (
                                  <img
                                    src={profilePicturePreview}
                                    alt="Pré-visualização da foto de perfil"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <User
                                    className="text-zinc-400 dark:text-zinc-500"
                                    size={30}
                                  />
                                )}
                              </div>

                              <div className="w-full space-y-2">
                                <label
                                  htmlFor="profile-picture"
                                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-800 lg:text-xs"
                                >
                                  <Upload size={16} />
                                  Selecionar
                                </label>

                                <label
                                  htmlFor="profile-picture-camera"
                                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-800 lg:text-xs"
                                >
                                  <Camera size={16} />
                                  Tirar foto
                                </label>

                                <p className="line-clamp-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
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
                                className={fieldIconClassName(
                                  "text-emerald-600 dark:text-emerald-300",
                                )}
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
                              <span className="text-zinc-500 dark:text-zinc-500">
                                (opcional)
                              </span>
                            </label>
                            <div className="relative">
                              <span
                                className={fieldIconClassName(
                                  "text-amber-600 dark:text-amber-300",
                                )}
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

                          <div>
                            <label className={labelClassName()} htmlFor="birth">
                              Data de nascimento
                            </label>
                            <div className="relative">
                              <span
                                className={fieldIconClassName(
                                  "text-violet-600 dark:text-violet-300",
                                )}
                              >
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
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelClassName()} htmlFor="email">
                        E-mail
                      </label>
                      <div className="relative">
                        <span
                          className={fieldIconClassName(
                            "text-sky-600 dark:text-sky-300",
                          )}
                        >
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
                        <span
                          className={fieldIconClassName(
                            "text-emerald-600 dark:text-emerald-300",
                          )}
                        >
                          <Phone size={16} />
                        </span>
                        <input
                          id="phone"
                          name="phone"
                          type="text"
                          inputMode="numeric"
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
                        <span
                          className={fieldIconClassName(
                            "text-rose-600 dark:text-rose-300",
                          )}
                        >
                          <MapPin size={16} />
                        </span>
                        <select
                          id="comunity"
                          name="comunity"
                          required
                          value={registerForm.comunity}
                          onChange={handleRegisterChange}
                          className={`${inputClassName()} pl-11 pr-10`}
                        >
                          <option value="">Selecione sua comunidade</option>
                          {activeCommunities.map((community) => (
                            <option key={community.key} value={community.key}>
                              {community.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClassName()} htmlFor="zipcode">
                        CEP
                      </label>
                      <div className="relative">
                        <span
                          className={fieldIconClassName(
                            "text-amber-600 dark:text-amber-300",
                          )}
                        >
                          <MapPin size={16} />
                        </span>

                        {hasPresetZipcodes ? (
                          <select
                            id="zipcode"
                            name="zipcode"
                            required
                            value={registerForm.zipcode}
                            onChange={handleRegisterChange}
                            className={`${inputClassName()} pl-11 pr-10`}
                            disabled={!registerForm.comunity}
                          >
                            <option value="">Selecione o CEP</option>
                            {communityZipcodes.map((zipcode) => (
                              <option key={zipcode} value={zipcode}>
                                {zipcode}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="zipcode"
                            name="zipcode"
                            type="text"
                            inputMode="numeric"
                            maxLength={9}
                            required
                            value={registerForm.zipcode}
                            onChange={handleRegisterChange}
                            className={`${inputClassName()} pl-11`}
                            placeholder="00000-000"
                            disabled={!registerForm.comunity}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClassName()} htmlFor="address_1">
                        {address1Label}
                      </label>
                      <div className="relative">
                        <span
                          className={fieldIconClassName(
                            "text-sky-600 dark:text-sky-300",
                          )}
                        >
                          <MapPin size={16} />
                        </span>

                        {hasPresetAddressItems ? (
                          <select
                            id="address_1"
                            name="address_1"
                            value={registerForm.address_1}
                            onChange={handleRegisterChange}
                            className={`${inputClassName()} pl-11 pr-10`}
                            required
                            disabled={!registerForm.comunity}
                          >
                            <option value="">
                              Selecione {address1Label.toLowerCase()}
                            </option>
                            {communityAddressItems.map((item) => (
                              <option key={item.value} value={item.label}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="address_1"
                            name="address_1"
                            type="text"
                            value={registerForm.address_1}
                            onChange={handleRegisterChange}
                            className={`${inputClassName()} pl-11`}
                            placeholder={address1Placeholder}
                            required
                            disabled={!registerForm.comunity}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClassName()} htmlFor="address_2">
                        Número e complemento
                      </label>
                      <div className="relative">
                        <span
                          className={fieldIconClassName(
                            "text-cyan-600 dark:text-cyan-300",
                          )}
                        >
                          <MapPin size={16} />
                        </span>
                        <input
                          id="address_2"
                          name="address_2"
                          type="text"
                          value={registerForm.address_2}
                          onChange={handleRegisterChange}
                          className={`${inputClassName()} pl-11`}
                          placeholder="Ex.: 12, casa 2, fundos, bloco B"
                          required
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
                        <span
                          className={fieldIconClassName(
                            "text-violet-600 dark:text-violet-300",
                          )}
                        >
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
                        <span
                          className={fieldIconClassName(
                            "text-violet-600 dark:text-violet-300",
                          )}
                        >
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sky-400 via-violet-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Cadastrando..." : "Criar conta"}
                        {!loading ? <ArrowRight size={17} /> : null}
                      </button>
                    </div>
                  </form>
                )}

                <footer className="mt-4 border-t border-zinc-200/80 pt-4 text-center dark:border-zinc-800/80 lg:mt-3 lg:pt-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <button
                        type="button"
                        onClick={openTermsModal}
                        className="font-medium underline underline-offset-4 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Termos de Uso
                      </button>

                      <span className="hidden text-zinc-300 dark:text-zinc-700 sm:inline">
                        •
                      </span>

                      <button
                        type="button"
                        onClick={openPrivacyModal}
                        className="font-medium underline underline-offset-4 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Política de Privacidade
                      </button>

                      <span className="hidden text-zinc-300 dark:text-zinc-700 sm:inline">
                        •
                      </span>

                      <Link
                        to="/child-policy"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Política de Segurança Infantil (CSAE)
                      </Link>
                    </div>

                    <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      Ao prosseguir com login ou cadastro, o usuário manifesta
                      ciência dos instrumentos jurídicos da plataforma e das
                      regras de tratamento de dados aplicáveis.
                    </p>

                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Desenvolvido Pela Equipe das:
                      </p>

                      <div className="mt-2 flex justify-center">
                        <img
                          src={developedByLogo}
                          alt="Equipe de Desenvolvimento"
                          className="h-10 object-contain opacity-85 transition hover:opacity-100"
                        />
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </section>
          </div>
        </div>
      </div>

      <LegalModal
        open={legalModalType !== null}
        type={legalModalType ?? "terms"}
        onClose={closeLegalModal}
      />
    </main>
  );
}
