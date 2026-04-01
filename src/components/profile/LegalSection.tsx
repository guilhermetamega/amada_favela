import { ExternalLink, FileText, Shield } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
};

function ActionButton({
  icon,
  title,
  description,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>

        <div className="shrink-0 text-zinc-400 dark:text-zinc-500">
          <ExternalLink size={16} />
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        target="_blank"
        rel="noreferrer"
        className="block rounded-3xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-3xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
    >
      {content}
    </button>
  );
}

export default function ProfileLegalSection({
  onOpenTerms,
  onOpenPrivacy,
}: Props) {
  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Termos e privacidade
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Consulte a qualquer momento os documentos jurídicos da plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <ActionButton
          icon={<FileText size={18} />}
          title="Termos de Uso"
          description="Leia as condições de utilização da plataforma em modal ou em página pública."
          onClick={onOpenTerms}
        />

        <ActionButton
          icon={<Shield size={18} />}
          title="Política de Privacidade"
          description="Consulte como tratamos dados cadastrais, telemetria, logs de acesso e dados de uso."
          onClick={onOpenPrivacy}
        />
      </div>
    </section>
  );
}
