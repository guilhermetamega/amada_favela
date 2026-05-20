import SectionCard from "@/components/resumeBuilder/Section";
import type {
  AssociationAddressData,
  ResumeProfileData,
} from "@/types/resume_builder";

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-500";

export default function PersonalDataSection({
  profile,
  associationAddress,
  email,
  linkedin,
  lattes,
  onEmailChange,
  onLinkedinChange,
  onLattesChange,
}: {
  profile: ResumeProfileData;
  associationAddress: AssociationAddressData | null;
  email: string;
  linkedin: string;
  lattes: string;
  onEmailChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onLattesChange: (value: string) => void;
}) {
  return (
    <SectionCard title="Dados pessoais">
      <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
        <p>
          <strong className="text-zinc-950 dark:text-zinc-100">Nome:</strong>{" "}
          {profile.fullname}
        </p>
        <p>
          <strong className="text-zinc-950 dark:text-zinc-100">
            Telefone:
          </strong>{" "}
          {profile.phone || "Não informado"}
        </p>
        <p>
          <strong className="text-zinc-950 dark:text-zinc-100">
            Endereço da associação:
          </strong>{" "}
          {associationAddress?.address || "Não informado"}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="E-mail profissional"
        />
        <input
          className={inputClass}
          value={linkedin}
          onChange={(e) => onLinkedinChange(e.target.value)}
          placeholder="LinkedIn (opcional)"
        />
        <input
          className={inputClass}
          value={lattes}
          onChange={(e) => onLattesChange(e.target.value)}
          placeholder="Currículo Lattes (opcional)"
        />
      </div>
    </SectionCard>
  );
}
