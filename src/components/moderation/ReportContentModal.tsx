import { useEffect, useState } from "react";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { submitContentReport } from "@/services/supabase/content_reports";
import type {
  ContentReportReason,
  ReportTarget,
} from "@/types/content_reports";

type Props = {
  open: boolean;
  target: ReportTarget | null;
  alreadyReported?: boolean;
  onSubmitted: (contentId: string) => void;
  onClose: () => void;
};

const REASON_OPTIONS: { value: ContentReportReason; label: string }[] = [
  { value: "child_safety", label: "Segurança infantil / menor em risco" },
  {
    value: "sexual_content_minor",
    label: "Conteúdo sexual envolvendo menor",
  },
  { value: "violence", label: "Violência, ameaça ou coação" },
  { value: "fraud", label: "Golpe, fraude ou anúncio enganoso" },
  { value: "spam", label: "Spam, duplicado ou abuso da área" },
  { value: "privacy", label: "Exposição de dados pessoais" },
  { value: "other", label: "Outro motivo" },
];

export default function ReportContentModal({
  open,
  target,
  alreadyReported = false,
  onSubmitted,
  onClose,
}: Props) {
  const [reason, setReason] = useState<ContentReportReason>("child_safety");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("child_safety");
      setDetails("");
      setSubmitting(false);
      setSubmittedMessage("");
      setErrorMessage("");
    }
  }, [open]);

  if (!open || !target) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      setSubmitting(true);

      const result = await submitContentReport({
        contentType: target?.contentType,
        contentId: target?.contentId,
        reason,
        details: details.trim() || undefined,
      });

      if (target) {
        onSubmitted(target.contentId);
      }

      setSubmittedMessage(
        result.created
          ? "Denúncia registrada com sucesso."
          : "Você já havia denunciado este conteúdo anteriormente.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao enviar denúncia.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-950 dark:bg-red-500/10 dark:text-red-300">
              <ShieldAlert size={14} />
              Denunciar conteúdo
            </div>

            <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-white">
              {target.contentLabel}
            </h2>
          </div>
        </div>

        {alreadyReported && !submittedMessage ? (
          <div className="space-y-4 p-5">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-700 dark:text-red-300">
              Você já denunciou este conteúdo.
              <br />A denúncia anterior permanece em análise enquanto estiver
              com status pendente ou em revisão.
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : submittedMessage ? (
          <div className="space-y-4 p-5">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-300">
              {submittedMessage}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Motivo
              </label>

              <select
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as ContentReportReason)
                }
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-red-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {REASON_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Detalhes adicionais
              </label>

              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Opcional"
                className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-red-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : null}
                Enviar denúncia
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
