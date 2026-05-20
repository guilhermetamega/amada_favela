import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CreditCard, Download, FileText, LoaderCircle, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import PersonalDataSection from "@/components/resumeBuilder/PersonalDataSection";
import ResumeBuilderPageSkeleton from "@/components/resumeBuilder/PageSkeleton";
import SkillsSection from "@/components/resumeBuilder/SkillsSection";
import TimelineListSection from "@/components/resumeBuilder/TimelineListSection";
import { usePermissions } from "@/hooks/usePermissions";
import { getProfileCache } from "@/lib/cache/profile-cache";
import { getResumeBuilderCache, saveResumeBuilderCache } from "@/lib/cache/resume-builder";
import { getAssociationResumeAddressData } from "@/services/supabase/association_public";
import { getMyProfile } from "@/services/supabase/user_profile";
import type { AssociationAddressData, ResumeBuilderFormData, ResumeProfileData } from "@/types/resume_builder";

const emptyForm: ResumeBuilderFormData = { templateId:"classic", email:"", linkedin:"", lattes:"", professionalTitle:"", summary:"", experiences:[], education:[], skills:[], additionalInfo:"" };
const allowedTemplates = ["classic", "modern", "compact"] as const;

const templateOptions = [
  { id: "classic", name: "Clássico", description: "Visual formal, com foco em experiência e formação." },
  { id: "modern", name: "Moderno", description: "Cabeçalho colorido e leitura rápida para triagens." },
  { id: "compact", name: "Compacto", description: "Mais conteúdo em uma página, ideal para histórico maior." },
] as const;

function normalizeFileName(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase(); }

function ensureTimelineItems(value: unknown): ResumeBuilderFormData["experiences"] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    id: typeof item?.id === "string" && item.id ? item.id : crypto.randomUUID(),
    institution: typeof item?.institution === "string" ? item.institution : "",
    role: typeof item?.role === "string" ? item.role : "",
    startMonth: typeof item?.startMonth === "string" ? item.startMonth : "",
    startYear: typeof item?.startYear === "string" ? item.startYear : "",
    endMonth: typeof item?.endMonth === "string" ? item.endMonth : "",
    endYear: typeof item?.endYear === "string" ? item.endYear : "",
    isCurrent: Boolean(item?.isCurrent),
    activities: typeof item?.activities === "string" ? item.activities : "",
  }));
}

function ensureSkills(value: unknown): ResumeBuilderFormData["skills"] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    id: typeof item?.id === "string" && item.id ? item.id : crypto.randomUUID(),
    name: typeof item?.name === "string" ? item.name : "",
  })).filter((item) => item.name.length > 0 || item.id.length > 0);
}

function sanitizeFormData(raw: Partial<ResumeBuilderFormData> | undefined, defaultEmail: string): ResumeBuilderFormData {
  const templateId: ResumeBuilderFormData["templateId"] = allowedTemplates.includes(raw?.templateId as (typeof allowedTemplates)[number]) ? (raw?.templateId as ResumeBuilderFormData["templateId"]) : "classic";
  return {
    ...emptyForm,
    ...raw,
    templateId,
    email: typeof raw?.email === "string" && raw.email ? raw.email : defaultEmail,
    linkedin: typeof raw?.linkedin === "string" ? raw.linkedin : "",
    lattes: typeof raw?.lattes === "string" ? raw.lattes : "",
    professionalTitle: typeof raw?.professionalTitle === "string" ? raw.professionalTitle : "",
    summary: typeof raw?.summary === "string" ? raw.summary : "",
    experiences: ensureTimelineItems(raw?.experiences),
    education: ensureTimelineItems(raw?.education),
    skills: ensureSkills(raw?.skills),
    additionalInfo: typeof raw?.additionalInfo === "string" ? raw.additionalInfo : "",
  };
}

function renderTimelineLines(items: ResumeBuilderFormData["experiences"]) {
  if (!items.length) return ["Adicione uma informação por linha."];
  return items.map((i) => `${i.institution} • ${i.role} (${i.startMonth}/${i.startYear} - ${i.isCurrent ? "Atual" : `${i.endMonth}/${i.endYear}`})${i.activities ? ` • ${i.activities}` : ""}`);
}

function ResumeSection({ title, children, compact = false }: { title: string; children: React.ReactNode; compact?: boolean; }) {
  return <section className={compact ? "space-y-1.5" : "space-y-2"}><h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{title}</h3>{children}</section>;
}

function LineList({ lines }: { lines: string[] }) {
  if (!lines.length) return <p className="text-zinc-400">Adicione uma informação por linha.</p>;
  return <ul className="space-y-1.5">{lines.map((line, index) => <li key={`${line}-${index}`} className="flex gap-2 leading-snug"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" /><span>{line}</span></li>)}</ul>;
}

function ResumePreview({ profile, associationAddress, data, previewRef }: { profile: ResumeProfileData; associationAddress: AssociationAddressData | null; data: ResumeBuilderFormData; previewRef: React.RefObject<HTMLDivElement | null>; }) {
  const contactItems = [
    { icon: Mail, label: data.email || "email@exemplo.com" },
    { icon: Phone, label: profile.phone || "Telefone não informado" },
    { icon: MapPin, label: associationAddress?.address || "Endereço não informado" },
  ];
  const experienceLines = renderTimelineLines(data.experiences);
  const educationLines = renderTimelineLines(data.education);
  const skillsLines = data.skills.length ? data.skills.map((s) => s.name) : [];
  const extraLines = data.additionalInfo.split("\n").map((line) => line.trim()).filter(Boolean);

  if (data.templateId === "modern") return <div ref={previewRef} className="resume-print-area mx-auto flex aspect-[210/297] w-full max-w-[794px] flex-col overflow-hidden bg-white text-[13px] text-zinc-700 shadow-2xl"><header className="bg-linear-to-br from-emerald-700 via-emerald-600 to-cyan-600 px-8 py-7 text-white"><p className="text-[11px] font-bold uppercase tracking-[0.32em] text-emerald-100">Currículo profissional</p><h2 className="mt-2 text-3xl font-black leading-tight">{profile.fullname}</h2><p className="mt-1 text-sm font-semibold text-emerald-50">{data.professionalTitle || "Cargo ou área de interesse"}</p><div className="mt-4 grid gap-2 text-[11px] text-emerald-50 sm:grid-cols-3">{contactItems.map((item) => { const Icon = item.icon; return <span key={item.label} className="flex items-center gap-1.5"><Icon size={12} />{item.label}</span>; })}</div></header><div className="grid flex-1 grid-cols-[1fr_240px] gap-6 px-8 py-6"><main className="space-y-5"><ResumeSection title="Resumo"><p className="whitespace-pre-line leading-relaxed">{data.summary || "Preencha esta seção no formulário."}</p></ResumeSection><ResumeSection title="Experiência profissional"><LineList lines={experienceLines} /></ResumeSection><ResumeSection title="Formação"><LineList lines={educationLines} /></ResumeSection></main><aside className="space-y-5 rounded-3xl bg-zinc-100 p-5"><ResumeSection title="Competências"><LineList lines={skillsLines} /></ResumeSection><ResumeSection title="Informações adicionais"><LineList lines={extraLines} /></ResumeSection></aside></div></div>;

  if (data.templateId === "compact") return <div ref={previewRef} className="resume-print-area mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden bg-white p-7 text-[12px] text-zinc-700 shadow-2xl"><header className="border-b-2 border-zinc-900 pb-4"><div className="flex items-start justify-between gap-5"><div><h2 className="text-2xl font-black uppercase tracking-tight text-zinc-950">{profile.fullname}</h2><p className="mt-1 font-bold text-zinc-700">{data.professionalTitle || "Cargo ou área de interesse"}</p></div><div className="max-w-[260px] space-y-1 text-right text-[10px] font-medium text-zinc-600">{contactItems.map((item) => <p key={item.label}>{item.label}</p>)}</div></div></header><main className="mt-5 grid grid-cols-[1fr_220px] gap-5"><div className="space-y-4"><ResumeSection title="Perfil profissional" compact><p className="whitespace-pre-line leading-relaxed">{data.summary || "Preencha esta seção no formulário."}</p></ResumeSection><ResumeSection title="Experiência" compact><LineList lines={experienceLines} /></ResumeSection><ResumeSection title="Formação" compact><LineList lines={educationLines} /></ResumeSection></div><div className="space-y-4 border-l border-zinc-200 pl-5"><ResumeSection title="Competências" compact><LineList lines={skillsLines} /></ResumeSection><ResumeSection title="Extras" compact><LineList lines={extraLines} /></ResumeSection></div></main></div>;

  return <div ref={previewRef} className="resume-print-area mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden bg-white p-8 text-[13px] text-zinc-700 shadow-2xl"><header className="text-center"><h2 className="text-3xl font-black uppercase tracking-[0.08em] text-zinc-950">{profile.fullname}</h2><p className="mt-2 text-sm font-bold text-emerald-700">{data.professionalTitle || "Cargo ou área de interesse"}</p><div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-zinc-600">{contactItems.map((item) => { const Icon = item.icon; return <span key={item.label} className="inline-flex items-center gap-1"><Icon size={12} />{item.label}</span>; })}</div></header><main className="mt-7 space-y-5"><ResumeSection title="Resumo profissional"><p className="whitespace-pre-line leading-relaxed">{data.summary || "Preencha esta seção no formulário."}</p></ResumeSection><ResumeSection title="Experiência profissional"><LineList lines={experienceLines} /></ResumeSection><ResumeSection title="Formação"><LineList lines={educationLines} /></ResumeSection><ResumeSection title="Competências"><LineList lines={skillsLines} /></ResumeSection><ResumeSection title="Informações adicionais"><LineList lines={extraLines} /></ResumeSection></main></div>;
}

export default function ResumeBuilderPage() {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<ResumeProfileData | null>(null);
  const [associationAddress, setAssociationAddress] = useState<AssociationAddressData | null>(null);
  const [formData, setFormData] = useState<ResumeBuilderFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const canAccessPremium = !!permissions?.canAccessPremium;

  useEffect(() => {
    if (permissionsLoading || !canAccessPremium) { setLoading(false); return; }
    let active = true;
    const cachedProfile = getProfileCache()?.profile ?? null;
    if (cachedProfile) {
      setProfile(cachedProfile);
      const cachedResume = getResumeBuilderCache(cachedProfile.id);
      setFormData(sanitizeFormData(cachedResume?.data, cachedProfile.email ?? ""));
      setLoading(false);
    }
    (async () => {
      try {
        const [nextProfile, association] = await Promise.all([getMyProfile(), getAssociationResumeAddressData()]);
        if (!active) return;
        setProfile(nextProfile);
        setAssociationAddress({ associationName: association.associationName, address: association.fullAddress });
        const cachedResume = getResumeBuilderCache(nextProfile.id);
        setFormData(sanitizeFormData(cachedResume?.data, nextProfile.email ?? ""));
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Erro ao carregar dados");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [canAccessPremium, permissionsLoading]);

  useEffect(() => {
    if (!profile || loading || !canAccessPremium) return;
    const timeout = window.setTimeout(() => { saveResumeBuilderCache(profile.id, formData); setSuccessMessage("Rascunho salvo localmente."); }, 300);
    return () => window.clearTimeout(timeout);
  }, [canAccessPremium, formData, loading, profile]);

  const updateField = <K extends keyof ResumeBuilderFormData>(field: K, value: ResumeBuilderFormData[K]) => setFormData((c) => ({ ...c, [field]: value }));

  async function handleDownload() { if (!previewRef.current || !profile || downloading) return; try { setDownloading(true); const dataUrl = await toPng(previewRef.current, { cacheBust:true, pixelRatio:2, backgroundColor:"#ffffff" }); const link = document.createElement("a"); link.href = dataUrl; link.download = `curriculo-${normalizeFileName(profile.fullname)}.png`; link.click(); } finally { setDownloading(false); } }

  if (permissionsLoading || loading) return <DashboardLayout><MainLayout><div className="mx-auto max-w-6xl"><DashboardHeader title="Criador de Currículos" /><ResumeBuilderPageSkeleton /></div></MainLayout></DashboardLayout>;
  if (!canAccessPremium) return <DashboardLayout><MainLayout><div className="mx-auto max-w-4xl"><DashboardHeader title="Criador de Currículos" /><section className="rounded-[28px] border border-amber-300/70 p-6"><span className="inline-flex items-center gap-2"><Sparkles size={14}/>Recurso para sócios</span><p className="mt-2">Funcionalidade exclusiva para usuários pagantes.</p><button type="button" onClick={() => navigate("/profile#partner-section")} className="mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2"><CreditCard size={14}/>Quero virar sócio</button></section></div></MainLayout></DashboardLayout>;
  if (!profile) return null;

  return <DashboardLayout><MainLayout><div className="mx-auto max-w-7xl"><DashboardHeader title="Criador de Currículos" />{errorMessage?<div className="mb-4 text-sm text-red-500">{errorMessage}</div>:null}{successMessage?<div className="mb-4 inline-flex items-center gap-2 text-emerald-600"><CheckCircle2 size={14}/>{successMessage}</div>:null}<div className="mb-4 flex gap-2"><button type="button" onClick={()=>window.print()} className="rounded-xl border px-4 py-2 text-sm"><FileText size={14} className="mr-1 inline"/>Imprimir/PDF</button><button type="button" onClick={handleDownload} disabled={downloading} className="rounded-xl border px-4 py-2 text-sm">{downloading?<LoaderCircle size={14} className="mr-1 inline animate-spin"/>:<Download size={14} className="mr-1 inline"/>}Baixar</button></div><div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,430px)_1fr]"><aside className="space-y-4"><PersonalDataSection profile={profile} associationAddress={associationAddress} email={formData.email} linkedin={formData.linkedin} lattes={formData.lattes} onEmailChange={(v)=>updateField("email",v)} onLinkedinChange={(v)=>updateField("linkedin",v)} onLattesChange={(v)=>updateField("lattes",v)} />
<section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"><h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Dados profissionais</h2><div className="mt-4 space-y-3"><input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700" value={formData.professionalTitle} onChange={(e)=>updateField("professionalTitle", e.target.value)} placeholder="Cargo ou área"/><textarea className="min-h-24 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700" value={formData.summary} onChange={(e)=>updateField("summary", e.target.value)} placeholder="Resumo profissional"/></div></section>
<section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"><h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Layout do currículo</h2><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">{templateOptions.map((template)=><button key={template.id} type="button" onClick={()=>updateField("templateId",template.id)} className={`rounded-xl border px-3 py-2 text-sm ${formData.templateId===template.id?"border-emerald-500 bg-emerald-50 text-emerald-700":"border-zinc-200"}`}><span className="font-semibold">{template.name}</span><span className="block text-xs opacity-70">{template.description}</span></button>)}</div></section>
<TimelineListSection title="Experiência" items={formData.experiences} limit={3} onChange={(v)=>updateField("experiences",v)} />
<TimelineListSection title="Formação" items={formData.education} limit={5} onChange={(v)=>updateField("education",v)} />
<SkillsSection items={formData.skills} onChange={(v)=>updateField("skills",v)} />
<section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"><h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Dados adicionais</h2><textarea className="mt-3 min-h-24 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700" value={formData.additionalInfo} onChange={(e)=>updateField("additionalInfo",e.target.value)} /></section>
</aside><section className="rounded-[28px] border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"><div className="overflow-x-auto rounded-3xl bg-zinc-200 p-3 dark:bg-zinc-900 sm:p-6"><div className="min-w-[620px]"><ResumePreview profile={profile} associationAddress={associationAddress} data={formData} previewRef={previewRef} /></div></div></section></div></div></MainLayout></DashboardLayout>;
}
