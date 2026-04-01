import { ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import LegalDocument from "@/components/legal/LegalDocument";
import { PRIVACY_POLICY_CONTENT, TERMS_OF_USE_CONTENT } from "@/lib/legal";

type Props = {
  open: boolean;
  type: "privacy" | "terms";
  onClose: () => void;
};

export default function LegalModal({ open, type, onClose }: Props) {
  if (!open) return null;

  const isPrivacy = type === "privacy";
  const content = isPrivacy ? PRIVACY_POLICY_CONTENT : TERMS_OF_USE_CONTENT;
  const fullPageHref = isPrivacy ? "/privacy" : "/terms";

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Acesso público
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {content.shortTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={fullPageHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Leia mais
              <ExternalLink size={16} />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <LegalDocument content={content} compact />
        </div>
      </div>
    </div>
  );
}
