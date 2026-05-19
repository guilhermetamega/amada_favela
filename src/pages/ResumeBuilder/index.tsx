import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CreditCard, Download, FileText, LoaderCircle, Sparkles } from "lucide-react";
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

function normalizeFileName(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase(); }

function renderTimeline(items: ResumeBuilderFormData["experiences"]) { return items.length? items.map((i)=><li key={i.id}>{i.institution} • {i.role} ({i.startMonth}/{i.startYear} - {i.isCurrent?"Atual":`${i.endMonth}/${i.endYear}`})<br/>{i.activities}</li>) : <li>Preencha no formulário.</li>; }

function ResumePreview({ profile, associationAddress, data, previewRef }: { profile: ResumeProfileData; associationAddress: AssociationAddressData | null; data: ResumeBuilderFormData; previewRef: React.RefObject<HTMLDivElement | null>; }) {
  return <div ref={previewRef} className="resume-print-area mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden bg-white p-8 text-[12px] text-zinc-800 shadow-2xl"><h2 className="text-3xl font-black text-zinc-950">{profile.fullname}</h2><p className="font-semibold text-emerald-700">{data.professionalTitle || "Cargo / área"}</p><div className="mt-2 text-[11px] text-zinc-600">{data.email} • {profile.phone || "-"}{data.linkedin?` • ${data.linkedin}`:""}{data.lattes?` • ${data.lattes}`:""}</div><div className="text-[11px] text-zinc-500">{associationAddress?.address || ""}</div><section className="mt-4"><h3 className="font-bold">Resumo</h3><p className="whitespace-pre-line">{data.summary || "Preencha no formulário."}</p></section><section className="mt-3"><h3 className="font-bold">Experiência profissional</h3><ul className="list-disc pl-5">{renderTimeline(data.experiences)}</ul></section><section className="mt-3"><h3 className="font-bold">Formação</h3><ul className="list-disc pl-5">{renderTimeline(data.education)}</ul></section><section className="mt-3"><h3 className="font-bold">Competências</h3><p>{data.skills.map((s)=>s.name).join(" • ") || "Preencha no formulário."}</p></section><section className="mt-3"><h3 className="font-bold">Dados adicionais</h3><p className="whitespace-pre-line">{data.additionalInfo || ""}</p></section></div>;
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
      setFormData({ ...emptyForm, email: cachedProfile.email ?? "", ...(cachedResume?.data ?? {}) });
      setLoading(false);
    }
    (async () => {
      try {
        const [nextProfile, association] = await Promise.all([getMyProfile(), getAssociationResumeAddressData()]);
        if (!active) return;
        setProfile(nextProfile);
        setAssociationAddress({ associationName: association.associationName, address: association.fullAddress });
        const cachedResume = getResumeBuilderCache(nextProfile.id);
        setFormData({ ...emptyForm, email: nextProfile.email ?? "", ...(cachedResume?.data ?? {}) });
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
<TimelineListSection title="Experiência" items={formData.experiences} limit={3} onChange={(v)=>updateField("experiences",v)} />
<TimelineListSection title="Formação" items={formData.education} limit={5} onChange={(v)=>updateField("education",v)} />
<SkillsSection items={formData.skills} onChange={(v)=>updateField("skills",v)} />
<section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"><h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Dados adicionais</h2><textarea className="mt-3 min-h-24 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700" value={formData.additionalInfo} onChange={(e)=>updateField("additionalInfo",e.target.value)} /></section>
</aside><section className="rounded-[28px] border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"><div className="overflow-x-auto rounded-3xl bg-zinc-200 p-3 dark:bg-zinc-900 sm:p-6"><div className="min-w-[620px]"><ResumePreview profile={profile} associationAddress={associationAddress} data={formData} previewRef={previewRef} /></div></div></section></div></div></MainLayout></DashboardLayout>;
}
