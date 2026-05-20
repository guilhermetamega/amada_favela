import Section from "@/components/resumeBuilder/Section";
import LineList from "@/components/resumeBuilder/LineList";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  AssociationAddressData,
  ResumeBuilderFormData,
  ResumeProfileData,
} from "@/types/resume_builder";

function renderTimelineLines(items: ResumeBuilderFormData["experiences"]) {
  if (!items.length) return ["Adicione uma informação por linha."];
  return items.map(
    (i) =>
      `${i.institution} - ${i.role} (${i.startMonth}/${i.startYear} - ${i.isCurrent ? "Atual" : `${i.endMonth}/${i.endYear}`})${i.activities ? ` - ${i.activities}` : ""}`,
  );
}

export default function ResumePreview({
  profile,
  associationAddress,
  data,
  previewRef,
}: {
  profile: ResumeProfileData;
  associationAddress: AssociationAddressData | null;
  data: ResumeBuilderFormData;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  const contactItems = [
    { icon: Mail, label: data.email || "email@exemplo.com" },
    { icon: Phone, label: profile.phone || "Telefone não informado" },
    {
      icon: MapPin,
      label: associationAddress?.address || "Endereço não informado",
    },
  ];
  const experienceLines = renderTimelineLines(data.experiences);
  const educationLines = renderTimelineLines(data.education);
  const skillsLines = data.skills.length ? data.skills.map((s) => s.name) : [];
  const extraLines = data.additionalInfo
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (data.templateId === "modern")
    return (
      <div
        ref={previewRef}
        className="resume-print-area mx-auto flex aspect-210/297 w-full max-w-198.5 flex-col overflow-hidden bg-white text-[13px] text-zinc-700 shadow-2xl"
      >
        <header className="bg-linear-to-br from-emerald-700 via-emerald-600 to-cyan-600 px-8 py-7 text-white">
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
            <Section title="Resumo">
              <p className="whitespace-pre-line leading-relaxed">
                {data.summary || "Preencha esta seção no formulário."}
              </p>
            </Section>
            <Section title="Experiência profissional">
              <LineList lines={experienceLines} />
            </Section>
            <Section title="Formação">
              <LineList lines={educationLines} />
            </Section>
          </main>
          <aside className="space-y-5 rounded-3xl bg-zinc-100 p-5">
            <Section title="Competências">
              <LineList lines={skillsLines} />
            </Section>
            <Section title="Informações adicionais">
              <LineList lines={extraLines} />
            </Section>
          </aside>
        </div>
      </div>
    );

  if (data.templateId === "compact")
    return (
      <div
        ref={previewRef}
        className="resume-print-area mx-auto aspect-210/297 w-full max-w-198.5 overflow-hidden bg-white p-7 text-[12px] text-zinc-700 shadow-2xl"
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
            <div className="max-w-65 space-y-1 text-right text-[10px] font-medium text-zinc-600">
              {contactItems.map((item) => (
                <p key={item.label}>{item.label}</p>
              ))}
            </div>
          </div>
        </header>
        <main className="mt-5 grid grid-cols-[1fr_220px] gap-5">
          <div className="space-y-4">
            <Section title="Perfil profissional" compact>
              <p className="whitespace-pre-line leading-relaxed">
                {data.summary || "Preencha esta seção no formulário."}
              </p>
            </Section>
            <Section title="Experiência" compact>
              <LineList lines={experienceLines} />
            </Section>
            <Section title="Formação" compact>
              <LineList lines={educationLines} />
            </Section>
          </div>
          <div className="space-y-4 border-l border-zinc-200 pl-5">
            <Section title="Competências" compact>
              <LineList lines={skillsLines} />
            </Section>
            <Section title="Extras" compact>
              <LineList lines={extraLines} />
            </Section>
          </div>
        </main>
      </div>
    );

  return (
    <div
      ref={previewRef}
      className="resume-print-area mx-auto aspect-210/297 w-full max-w-198.5 overflow-hidden bg-white p-8 text-[13px] text-zinc-700 shadow-2xl"
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
        <Section title="Resumo profissional">
          <p className="whitespace-pre-line leading-relaxed">
            {data.summary || "Preencha esta seção no formulário."}
          </p>
        </Section>
        <Section title="Experiência profissional">
          <LineList lines={experienceLines} />
        </Section>
        <Section title="Formação">
          <LineList lines={educationLines} />
        </Section>
        <Section title="Competências">
          <LineList lines={skillsLines} />
        </Section>
        <Section title="Informações adicionais">
          <LineList lines={extraLines} />
        </Section>
      </main>
    </div>
  );
}
