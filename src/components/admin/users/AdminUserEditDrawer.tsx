import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Building2,
  Check,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  listAdminCommunityOptions,
  updateAdminUser,
} from "@/services/supabase/admin-user-edit";
import type { AdminUserDetailResponse } from "@/types/admin-user-detail";
import type {
  AdminCommunityOption,
  AdminUserBasicEditData,
  AdminUserEditMode,
  AdminUserSensitiveEditData,
  AdminVerificationMethod,
} from "@/types/admin-user-edit";

type AdminUserEditDrawerProps = {
  isOpen: boolean;
  detail: AdminUserDetailResponse;
  onClose: () => void;
  onUpdated: (message: string) => Promise<void> | void;
};

const verificationOptions: Array<{
  value: AdminVerificationMethod;
  label: string;
  description: string;
}> = [
  {
    value: "document_with_photo",
    label: "Documento com foto",
    description: "O documento apresentado foi conferido presencialmente.",
  },
  {
    value: "existing_registration_confirmation",
    label: "Conferência cadastral",
    description: "Dados anteriores foram confirmados com o usuário.",
  },
  {
    value: "in_person_confirmation",
    label: "Confirmação presencial",
    description: "A solicitação foi feita pessoalmente pelo titular.",
  },
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpfInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatZipcodeInput(value: string) {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

type FieldProps = {
  label: string;
  icon: typeof UserRound;
  children: React.ReactNode;
  hint?: string;
};

function Field({ label, icon: Icon, children, hint }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        <Icon size={16} className="text-cyan-600 dark:text-cyan-400" />
        {label}
      </span>

      {children}

      {hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-zinc-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export default function AdminUserEditDrawer({
  isOpen,
  detail,
  onClose,
  onUpdated,
}: AdminUserEditDrawerProps) {
  const { permissions } = usePermissions();

  const [mode, setMode] = useState<AdminUserEditMode>(
    detail.permissions.canEditBasicData ? "basic" : "sensitive",
  );

  const [basicData, setBasicData] = useState<AdminUserBasicEditData>({
    fullname: "",
    phone: "",
    address1: "",
    addressNumber: "",
    address2: "",
    zipcode: "",
  });

  const [sensitiveData, setSensitiveData] =
    useState<AdminUserSensitiveEditData>({
      email: "",
      cpf: "",
      birth: "",
      role: "user",
      community: "",
    });

  const [verificationMethod, setVerificationMethod] =
    useState<AdminVerificationMethod>("in_person_confirmation");

  const [reason, setReason] = useState("");

  const [confirmed, setConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const [communities, setCommunities] = useState<AdminCommunityOption[]>([]);

  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = permissions?.isAdmin === true;

  useEffect(() => {
    if (!isOpen) return;

    setMode(detail.permissions.canEditBasicData ? "basic" : "sensitive");

    setBasicData({
      fullname: detail.profile.fullname,

      phone: formatPhoneInput(detail.profile.phone),

      address1: detail.profile.address1,

      addressNumber: detail.profile.addressNumber ?? "",

      address2: detail.profile.address2 ?? "",

      zipcode: formatZipcodeInput(detail.profile.zipcode),
    });

    setSensitiveData({
      email: detail.profile.email,
      cpf: "",
      birth: detail.profile.birth ?? "",
      role: detail.profile.role === "admin" ? "user" : detail.profile.role,
      community: detail.profile.community,
    });

    setVerificationMethod("in_person_confirmation");

    setReason("");
    setConfirmed(false);
    setErrorMessage("");
  }, [detail, isOpen]);

  useEffect(() => {
    if (!isOpen || !isAdmin || communities.length > 0) {
      return;
    }

    let active = true;

    async function loadCommunities() {
      try {
        setLoadingCommunities(true);

        const data = await listAdminCommunityOptions();

        if (active) {
          setCommunities(data);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as comunidades.",
          );
        }
      } finally {
        if (active) {
          setLoadingCommunities(false);
        }
      }
    }

    void loadCommunities();

    return () => {
      active = false;
    };
  }, [communities.length, isAdmin, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, submitting]);

  const canSubmit = useMemo(
    () => confirmed && reason.trim().length >= 10 && !submitting,
    [confirmed, reason, submitting],
  );

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setErrorMessage("");

      const sensitivePayload: AdminUserSensitiveEditData = {
        email: sensitiveData.email.trim(),

        birth: sensitiveData.birth,

        role: sensitiveData.role,

        community: sensitiveData.community,
      };

      if (sensitiveData.cpf?.trim()) {
        sensitivePayload.cpf = onlyDigits(sensitiveData.cpf);
      }

      const result = await updateAdminUser({
        targetUserId: detail.profile.id,

        mode,

        data:
          mode === "basic"
            ? {
                ...basicData,

                phone: onlyDigits(basicData.phone),

                zipcode: onlyDigits(basicData.zipcode),
              }
            : sensitivePayload,

        verificationMethod,
        reason: reason.trim(),
      });

      await onUpdated(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o usuário.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVerification = verificationOptions.find(
    (item) => item.value === verificationMethod,
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !submitting) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-edit-title"
        className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-zinc-950"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <h2
              id="admin-user-edit-title"
              className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100"
            >
              Editar: {detail.profile.fullname}
            </h2>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Fechar edição"
          >
            <X size={20} />
          </button>
        </header>

        <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!detail.permissions.canEditBasicData}
              onClick={() => setMode("basic")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                mode === "basic"
                  ? "bg-cyan-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              Dados básicos
            </button>

            <button
              type="button"
              disabled={!detail.permissions.canEditSensitiveData}
              onClick={() => setMode("sensitive")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                mode === "sensitive"
                  ? "bg-violet-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              Dados sensíveis
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
              >
                <AlertTriangle size={19} className="mt-0.5 shrink-0" />

                {errorMessage}
              </div>
            ) : null}

            {mode === "basic" ? (
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Nome completo" icon={UserRound}>
                    <input
                      type="text"
                      value={basicData.fullname}
                      onChange={(event) =>
                        setBasicData((current) => ({
                          ...current,

                          fullname: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </Field>
                </div>

                <Field label="Telefone" icon={Phone}>
                  <input
                    type="tel"
                    value={basicData.phone}
                    onChange={(event) =>
                      setBasicData((current) => ({
                        ...current,

                        phone: formatPhoneInput(event.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </Field>

                <Field label="CEP" icon={MapPin}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={basicData.zipcode}
                    onChange={(event) =>
                      setBasicData((current) => ({
                        ...current,

                        zipcode: formatZipcodeInput(event.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Rua" icon={MapPin}>
                    <input
                      type="text"
                      value={basicData.address1}
                      onChange={(event) =>
                        setBasicData((current) => ({
                          ...current,

                          address1: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </Field>
                </div>

                <Field label="Número" icon={Building2}>
                  <input
                    type="text"
                    value={basicData.addressNumber}
                    onChange={(event) =>
                      setBasicData((current) => ({
                        ...current,

                        addressNumber: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </Field>

                <Field label="Complemento" icon={Building2}>
                  <input
                    type="text"
                    value={basicData.address2}
                    onChange={(event) =>
                      setBasicData((current) => ({
                        ...current,

                        address2: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </Field>
              </section>
            ) : (
              <section className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                  <LockKeyhole size={20} className="mt-0.5 shrink-0" />

                  <p>
                    E-mail, CPF, nascimento, função e comunidade são dados
                    sensíveis. Confirme a identidade do usuário antes de
                    prosseguir.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="E-mail" icon={Mail}>
                    <input
                      type="email"
                      value={sensitiveData.email}
                      onChange={(event) =>
                        setSensitiveData((current) => ({
                          ...current,

                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </Field>

                  <Field label="Data de nascimento" icon={Fingerprint}>
                    <input
                      type="date"
                      value={sensitiveData.birth}
                      onChange={(event) =>
                        setSensitiveData((current) => ({
                          ...current,

                          birth: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </Field>
                </div>

                <Field
                  label="Novo CPF"
                  icon={Fingerprint}
                  hint={`CPF atual: ${
                    detail.profile.cpf ?? "não informado"
                  }. Deixe em branco para manter o atual.`}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sensitiveData.cpf ?? ""}
                    onChange={(event) =>
                      setSensitiveData((current) => ({
                        ...current,

                        cpf: formatCpfInput(event.target.value),
                      }))
                    }
                    placeholder="Preencha apenas para alterar"
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Função" icon={ShieldCheck}>
                    <select
                      value={sensitiveData.role}
                      onChange={(event) =>
                        setSensitiveData((current) => ({
                          ...current,

                          role: event.target
                            .value as AdminUserSensitiveEditData["role"],
                        }))
                      }
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="user">Usuário</option>

                      <option value="employee">Funcionário</option>

                      {isAdmin ? (
                        <option value="president">Presidente</option>
                      ) : null}
                    </select>
                  </Field>

                  <Field
                    label="Comunidade"
                    icon={Building2}
                    hint={
                      isAdmin
                        ? undefined
                        : "Presidentes não podem transferir usuários entre comunidades."
                    }
                  >
                    {isAdmin ? (
                      <select
                        value={sensitiveData.community}
                        disabled={loadingCommunities}
                        onChange={(event) =>
                          setSensitiveData((current) => ({
                            ...current,

                            community: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        {!communities.some(
                          (community) =>
                            community.key === sensitiveData.community,
                        ) ? (
                          <option value={sensitiveData.community}>
                            {detail.profile.communityLabel}
                          </option>
                        ) : null}

                        {communities.map((community) => (
                          <option key={community.key} value={community.key}>
                            {community.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={detail.profile.communityLabel}
                        className="w-full rounded-2xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      />
                    )}
                  </Field>
                </div>
              </section>
            )}

            <section className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Confirmação da alteração
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Informe como a identidade foi verificada e a justificativa
                  administrativa.
                </p>
              </div>

              <Field label="Método de verificação" icon={ShieldCheck}>
                <select
                  value={verificationMethod}
                  onChange={(event) =>
                    setVerificationMethod(
                      event.target.value as AdminVerificationMethod,
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {verificationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedVerification ? (
                <div className="rounded-2xl bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  {selectedVerification.description}
                </div>
              ) : null}

              <Field
                label="Justificativa"
                icon={Fingerprint}
                hint={`${reason.trim().length}/500 caracteres. Mínimo de 10.`}
              >
                <textarea
                  value={reason}
                  maxLength={500}
                  rows={4}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ex.: Correção solicitada presencialmente pelo titular após conferência do documento."
                  className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-cyan-600"
                />

                <span>
                  <span className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    {confirmed ? (
                      <Check size={17} className="text-emerald-600" />
                    ) : null}
                    Confirmo a verificação
                  </span>

                  <span className="mt-1 block text-sm leading-5 text-zinc-500">
                    Declaro que conferi a identidade do usuário e que a
                    justificativa informada é verdadeira.
                  </span>
                </span>
              </label>
            </section>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-zinc-200 p-5 sm:flex-row sm:justify-end dark:border-zinc-800">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-2xl border border-zinc-300 px-5 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar alterações
                </>
              )}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
