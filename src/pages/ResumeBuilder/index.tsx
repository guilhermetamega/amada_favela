import { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import ResumeBuilderPageSkeleton from "@/components/resumeBuilder/PageSkeleton";
import { usePermissions } from "@/hooks/usePermissions";
import { getProfileCache } from "@/lib/cache/profile-cache";
import {
  getResumeBuilderCache,
  saveResumeBuilderCache,
} from "@/lib/cache/resume-builder";
import { COMMUNITIES } from "@/lib/communities";
import { getMyProfile } from "@/services/supabase/user_profile";
import type {
  ResumeBuilderFormData,
  ResumeProfileData,
  ResumeTemplateId,
} from "@/types/resume_builder";

const TEMPLATE_OPTIONS: Array<{
  id: ResumeTemplateId;
  name: string;
  description: string;
}> = [
  {
    id: "classic",
    name: "Clássico",
    description: "Visual formal, com foco em experiência e formação.",
  },
  {
    id: "modern",
    name: "Moderno",
    description: "Cabeçalho colorido e leitura rápida para triagens.",
  },
  {
    id: "compact",
    name: "Compacto",
    description: "Mais conteúdo em uma página, ideal para histórico maior.",
  },
];

const emptyForm: ResumeBuilderFormData = {
  templateId: "classic",
  email: "",
  professionalTitle: "",
  summary: "",
  education: "",
  experience: "",
  skills: "",
  extra: "",
};

function getCommunityLabel(comunity: string | null | undefined) {
  if (!comunity) return "Cidade não informada";

  return COMMUNITIES.find((item) => item.key === comunity)?.label ?? comunity;
}

function buildAddress(profile: ResumeProfileData | null) {
  if (!profile) return "";

  return [profile.address_1, profile.address_number, profile.address_2]
    .filter(Boolean)
    .join(", ");
}

function getFirstName(fullname: string | undefined) {
  return fullname?.trim().split(/\s+/)[0] || "seu";
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

function ResumeSection({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "space-y-1.5" : "space-y-2"}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TextBlock({ value }: { value: string }) {
  if (!value.trim()) {
    return <p className="text-zinc-400">Preencha esta seção no formulário.</p>;
  }

  return <p className="whitespace-pre-line leading-relaxed">{value}</p>;
}

function LineList({ value }: { value: string }) {
  const lines = splitLines(value);

  if (lines.length === 0) {
    return <p className="text-zinc-400">Adicione uma informação por linha.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`} className="flex gap-2 leading-snug">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function ResumePreview({
  profile,
  data,
  previewRef,
}: {
  profile: ResumeProfileData;
  data: ResumeBuilderFormData;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  const address = buildAddress(profile);
  const city = getCommunityLabel(profile.comunity);
  const contactItems = [
    { icon: Mail, label: data.email || "email@exemplo.com" },
    { icon: Phone, label: profile.phone || "Telefone não informado" },
    { icon: MapPin, label: address ? `${city} • ${address}` : city },
  ];

  if (data.templateId === "modern") {
    return (
      <div
        ref={previewRef}
        className="resume-print-area mx-auto flex aspect-[210/297] w-full max-w-[794px] flex-col overflow-hidden bg-white text-[13px] text-zinc-700 shadow-2xl"
      >
        <header className="bg-linear-to-br from-emerald-700 via-emerald-600 to-cyan-600 px-8 py-7 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-emerald-100">
            Currículo profissional
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight">
            {profile.fullname}
          </h2>
          <p className="mt-1 text-sm font-semibold text-emerald-50">
            {data.professionalTitle || "Cargo ou área de interesse"}
          </p>
          <div className="mt-4 grid gap-2 text-[11px] text-emerald-50 sm:grid-cols-3">
            {contactItems.map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.label} className="flex items-center gap-1.5">
                  <Icon size={12} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </header>

        <div className="grid flex-1 grid-cols-[1fr_240px] gap-6 px-8 py-6">
          <main className="space-y-5">
            <ResumeSection title="Resumo">
              <TextBlock value={data.summary} />
            </ResumeSection>
            <ResumeSection title="Experiência profissional">
              <LineList value={data.experience} />
            </ResumeSection>
            <ResumeSection title="Formação">
              <LineList value={data.education} />
            </ResumeSection>
          </main>

          <aside className="space-y-5 rounded-3xl bg-zinc-100 p-5">
            <ResumeSection title="Competências">
              <LineList value={data.skills} />
            </ResumeSection>
            <ResumeSection title="Informações adicionais">
              <LineList value={data.extra} />
            </ResumeSection>
          </aside>
        </div>
      </div>
    );
  }

  if (data.templateId === "compact") {
    return (
      <div
        ref={previewRef}
        className="resume-print-area mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden bg-white p-7 text-[12px] text-zinc-700 shadow-2xl"
      >
        <header className="border-b-2 border-zinc-900 pb-4">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-950">
                {profile.fullname}
              </h2>
              <p className="mt-1 font-bold text-zinc-700">
                {data.professionalTitle || "Cargo ou área de interesse"}
              </p>
            </div>
            <div className="max-w-[260px] space-y-1 text-right text-[10px] font-medium text-zinc-600">
              {contactItems.map((item) => (
                <p key={item.label}>{item.label}</p>
              ))}
            </div>
          </div>
        </header>

        <main className="mt-5 grid grid-cols-[1fr_220px] gap-5">
          <div className="space-y-4">
            <ResumeSection title="Perfil profissional" compact>
              <TextBlock value={data.summary} />
            </ResumeSection>
            <ResumeSection title="Experiência" compact>
              <LineList value={data.experience} />
            </ResumeSection>
            <ResumeSection title="Formação" compact>
              <LineList value={data.education} />
            </ResumeSection>
          </div>
          <div className="space-y-4 border-l border-zinc-200 pl-5">
            <ResumeSection title="Competências" compact>
              <LineList value={data.skills} />
            </ResumeSection>
            <ResumeSection title="Extras" compact>
              <LineList value={data.extra} />
            </ResumeSection>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      ref={previewRef}
      className="resume-print-area mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden bg-white p-8 text-[13px] text-zinc-700 shadow-2xl"
    >
      <header className="text-center">
        <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-zinc-950">
          {profile.fullname}
        </h2>
        <p className="mt-2 text-sm font-bold text-emerald-700">
          {data.professionalTitle || "Cargo ou área de interesse"}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-zinc-600">
          {contactItems.map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.label} className="inline-flex items-center gap-1">
                <Icon size={12} />
                {item.label}
              </span>
            );
          })}
        </div>
      </header>

      <main className="mt-7 space-y-5">
        <ResumeSection title="Resumo profissional">
          <TextBlock value={data.summary} />
        </ResumeSection>
        <ResumeSection title="Experiência profissional">
          <LineList value={data.experience} />
        </ResumeSection>
        <ResumeSection title="Formação">
          <LineList value={data.education} />
        </ResumeSection>
        <ResumeSection title="Competências">
          <LineList value={data.skills} />
        </ResumeSection>
        <ResumeSection title="Informações adicionais">
          <LineList value={data.extra} />
        </ResumeSection>
      </main>
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
      {children}
      {helper ? (
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-500";

export default function ResumeBuilderPage() {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement | null>(null);

  const [profile, setProfile] = useState<ResumeProfileData | null>(null);
  const [formData, setFormData] = useState<ResumeBuilderFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canAccessPremium = !!permissions?.canAccessPremium;

  useEffect(() => {
    if (permissionsLoading || !canAccessPremium) {
      setLoading(false);
      return;
    }

    let active = true;
    const cachedProfile = getProfileCache()?.profile ?? null;

    if (cachedProfile) {
      setProfile(cachedProfile);
      const cachedResume = getResumeBuilderCache(cachedProfile.id);
      setFormData({
        ...emptyForm,
        email: cachedProfile.email ?? "",
        ...(cachedResume?.data ?? {}),
      });
      setLoading(false);
    }

    async function loadProfile() {
      try {
        if (!cachedProfile) setLoading(true);
        setErrorMessage("");

        const nextProfile = await getMyProfile();

        if (!active) return;

        setProfile(nextProfile);

        const cachedResume = getResumeBuilderCache(nextProfile.id);
        setFormData({
          ...emptyForm,
          email: nextProfile.email ?? "",
          ...(cachedResume?.data ?? {}),
        });
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seus dados.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [canAccessPremium, permissionsLoading]);

  useEffect(() => {
    if (!profile || loading || !canAccessPremium) return;

    const timeout = window.setTimeout(() => {
      saveResumeBuilderCache(profile.id, formData);
      setSuccessMessage("Rascunho salvo automaticamente neste dispositivo.");
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [canAccessPremium, formData, loading, profile]);

  const selectedTemplate = useMemo(
    () => TEMPLATE_OPTIONS.find((item) => item.id === formData.templateId),
    [formData.templateId],
  );

  function updateField<FieldName extends keyof ResumeBuilderFormData>(
    field: FieldName,
    value: ResumeBuilderFormData[FieldName],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleDownload() {
    if (!previewRef.current || !profile || downloading) return;

    try {
      setDownloading(true);
      setErrorMessage("");

      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `curriculo-${normalizeFileName(profile.fullname)}.png`;
      link.click();
    } catch {
      setErrorMessage("Não foi possível baixar o currículo agora.");
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (permissionsLoading || loading) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-6xl">
            <DashboardHeader title="Criador de Currículos" />
            <ResumeBuilderPageSkeleton />
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  if (!canAccessPremium) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-4xl">
            <DashboardHeader title="Criador de Currículos" />
            <section className="overflow-hidden rounded-[28px] border border-amber-300/70 bg-linear-to-br from-amber-50 via-white to-orange-50 p-6 shadow-sm dark:border-amber-400/20 dark:from-amber-400/10 dark:via-zinc-950 dark:to-orange-400/10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                    <Sparkles size={14} />
                    Recurso para sócios
                  </span>
                  <h1 className="mt-4 text-2xl font-black text-zinc-950 dark:text-zinc-50">
                    Crie currículos de uma página com seus dados da plataforma.
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Esta funcionalidade é exclusiva para usuários pagantes. Ao se
                    tornar sócio, você libera os modelos de currículo, a prévia e
                    o cache permanente neste dispositivo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/profile#partner-section")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/80 bg-linear-to-r from-amber-300 via-yellow-300 to-orange-300 px-5 py-3 text-sm font-bold text-amber-950 shadow-[0_12px_30px_rgba(251,191,36,0.22)] transition hover:-translate-y-0.5"
                >
                  <CreditCard size={16} />
                  Quero virar sócio
                </button>
              </div>
            </section>
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl">
          <DashboardHeader title="Criador de Currículos" />

          <section className="mb-5 overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <FileText size={14} />
                  3 modelos • 1 página
                </span>
                <h1 className="mt-3 text-2xl font-black text-zinc-950 dark:text-zinc-50">
                  Monte o currículo de {getFirstName(profile?.fullname)} em
                  poucos minutos.
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Nome, cidade e telefone vêm do seu perfil e ficam fixos. O
                  e-mail e as demais informações são salvos apenas no cache
                  permanente deste dispositivo.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  <FileText size={16} />
                  Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading || !profile}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {downloading ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Baixar imagem
                </button>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={16} />
              {successMessage}
            </div>
          ) : null}

          {profile ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,430px)_1fr]">
              <aside className="space-y-5 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
                <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Dados fixos do perfil
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <p>
                      <strong className="text-zinc-950 dark:text-zinc-100">
                        Nome:
                      </strong>{" "}
                      {profile.fullname}
                    </p>
                    <p>
                      <strong className="text-zinc-950 dark:text-zinc-100">
                        Cidade:
                      </strong>{" "}
                      {getCommunityLabel(profile.comunity)}
                    </p>
                    <p>
                      <strong className="text-zinc-950 dark:text-zinc-100">
                        Telefone:
                      </strong>{" "}
                      {profile.phone || "Não informado"}
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Modelo
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {TEMPLATE_OPTIONS.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => updateField("templateId", template.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          formData.templateId === template.id
                            ? "border-emerald-400 bg-emerald-50 text-emerald-950 ring-4 ring-emerald-400/10 dark:border-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-100"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="font-bold">{template.name}</span>
                        <span className="mt-1 block text-xs opacity-75">
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <Field label="E-mail exibido" helper="Pode ser pessoal ou profissional.">
                    <input
                      className={inputClass}
                      type="email"
                      value={formData.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="seuemail@exemplo.com"
                    />
                  </Field>

                  <Field label="Cargo ou área desejada">
                    <input
                      className={inputClass}
                      value={formData.professionalTitle}
                      onChange={(event) =>
                        updateField("professionalTitle", event.target.value)
                      }
                      placeholder="Ex.: Auxiliar administrativo"
                    />
                  </Field>

                  <Field label="Resumo profissional">
                    <textarea
                      className={`${inputClass} min-h-28 resize-y`}
                      value={formData.summary}
                      onChange={(event) => updateField("summary", event.target.value)}
                      placeholder="Conte em poucas linhas seu objetivo e principais qualidades."
                    />
                  </Field>

                  <Field label="Experiência profissional" helper="Use uma informação por linha.">
                    <textarea
                      className={`${inputClass} min-h-36 resize-y`}
                      value={formData.experience}
                      onChange={(event) =>
                        updateField("experience", event.target.value)
                      }
                      placeholder="Empresa • Cargo • Período • Atividades"
                    />
                  </Field>

                  <Field label="Formação" helper="Use uma informação por linha.">
                    <textarea
                      className={`${inputClass} min-h-28 resize-y`}
                      value={formData.education}
                      onChange={(event) => updateField("education", event.target.value)}
                      placeholder="Curso • Instituição • Ano"
                    />
                  </Field>

                  <Field label="Competências" helper="Use uma competência por linha.">
                    <textarea
                      className={`${inputClass} min-h-28 resize-y`}
                      value={formData.skills}
                      onChange={(event) => updateField("skills", event.target.value)}
                      placeholder="Atendimento ao cliente\nPacote Office\nOrganização"
                    />
                  </Field>

                  <Field label="Informações adicionais" helper="Opcional: cursos, idiomas, CNH, disponibilidade.">
                    <textarea
                      className={`${inputClass} min-h-24 resize-y`}
                      value={formData.extra}
                      onChange={(event) => updateField("extra", event.target.value)}
                      placeholder="Disponibilidade imediata\nInglês básico"
                    />
                  </Field>
                </section>
              </aside>

              <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-100 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Prévia
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Modelo {selectedTemplate?.name.toLowerCase()} limitado a
                      uma página.
                    </p>
                  </div>
                  <BriefcaseBusiness
                    className="text-emerald-600 dark:text-emerald-400"
                    size={22}
                  />
                </div>
                <div className="overflow-x-auto rounded-3xl bg-zinc-200 p-3 dark:bg-zinc-900 sm:p-6">
                  <div className="min-w-[620px]">
                    <ResumePreview
                      profile={profile}
                      data={formData}
                      previewRef={previewRef}
                    />
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
