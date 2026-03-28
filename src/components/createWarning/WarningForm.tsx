import type { ReactNode, FormEvent } from "react";
import { LoaderCircle, Palette, Send, TimerReset } from "lucide-react";

type Props = {
  message: string;
  textColor: string;
  expiresAt: string;
  loading: boolean;
  onMessageChange: (value: string) => void;
  onTextColorChange: (value: string) => void;
  onExpiresAtChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

function FieldLabel({
  htmlFor,
  icon,
  children,
}: {
  htmlFor: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
    >
      <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>
      {children}
    </label>
  );
}

export default function WarningForm({
  message,
  textColor,
  expiresAt,
  loading,
  onMessageChange,
  onTextColorChange,
  onExpiresAtChange,
  onSubmit,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Dados do comunicado
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Preencha os campos abaixo para publicar um novo banner.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 p-4 sm:p-5">
        <div>
          <FieldLabel htmlFor="message" icon={<Send size={16} />}>
            Texto do comunicado
          </FieldLabel>

          <textarea
            id="message"
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            rows={6}
            maxLength={220}
            placeholder="Ex.: Reunião geral da comunidade neste sábado às 18h na associação."
            className="min-h-36 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900"
            required
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mantenha a mensagem curta e clara para melhor leitura no banner.
            </p>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {message.length}/220
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
          <div>
            <FieldLabel htmlFor="textColor" icon={<Palette size={16} />}>
              Cor
            </FieldLabel>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950">
              <input
                id="textColor"
                type="color"
                value={textColor}
                onChange={(event) => onTextColorChange(event.target.value)}
                className="h-12 w-full cursor-pointer rounded-xl border-0 bg-transparent p-0"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="expiresAt" icon={<TimerReset size={16} />}>
              Data de expiração
            </FieldLabel>

            <input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => onExpiresAtChange(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            O banner será publicado para a comunidade vinculada à sua role.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {loading ? "Publicando..." : "Publicar comunicado"}
          </button>
        </div>
      </form>
    </section>
  );
}
