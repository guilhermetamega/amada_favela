import type { FormEvent } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

type PasswordFormState = {
  password: string;
  confirmPassword: string;
};

type Props = {
  form: PasswordFormState;
  saving: boolean;
  onChange: (next: PasswordFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProfileSecuritySection({
  form,
  saving,
  onChange,
  onSubmit,
}: Props) {
  function update<K extends keyof PasswordFormState>(
    key: K,
    value: PasswordFormState[K],
  ) {
    onChange({
      ...form,
      [key]: value,
    });
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Segurança
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Atualize sua senha de acesso.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nova senha
          </span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Confirmar nova senha
          </span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {saving ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <LockKeyhole size={16} />
            )}
            Atualizar senha
          </button>
        </div>
      </form>
    </section>
  );
}
