import type { FormEvent, ReactNode } from "react";
import { LoaderCircle, Pencil, Save, X } from "lucide-react";
import type { ProfileUser, UpdateProfileInput } from "@/types/profile";

type AddressItem = {
  label: string;
  value: string;
  type?: "street" | "block";
};

type Props = {
  profile: ProfileUser;
  form: UpdateProfileInput;
  address1Label: string;
  address1Placeholder: string;
  communityZipcodes: string[];
  communityAddressItems: AddressItem[];
  hasPresetZipcodes: boolean;
  hasPresetAddressItems: boolean;
  saving: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChange: (next: UpdateProfileInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProfilePersonalSection({
  profile,
  form,
  address1Label,
  address1Placeholder,
  communityZipcodes,
  communityAddressItems,
  hasPresetZipcodes,
  hasPresetAddressItems,
  saving,
  editing,
  onStartEdit,
  onCancelEdit,
  onChange,
  onSubmit,
}: Props) {
  function handleField<K extends keyof UpdateProfileInput>(
    key: K,
    value: UpdateProfileInput[K],
  ) {
    onChange({
      ...form,
      [key]: value,
    });
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Dados pessoais
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:mx-0">
            Informações básicas do seu cadastro.
          </p>
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <Pencil size={15} />
            Editar
          </button>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nome completo">
            <input
              value={editing ? (form.fullname ?? "") : (profile.fullname ?? "")}
              onChange={(e) => handleField("fullname", e.target.value)}
              disabled={!editing}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-950/60"
            />
          </Field>

          <Field label="E-mail">
            <input
              value={profile.email ?? ""}
              disabled
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-400"
            />
          </Field>

          <Field label={address1Label}>
            {editing && hasPresetAddressItems ? (
              <select
                value={form.address_1 ?? ""}
                onChange={(e) => handleField("address_1", e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                required
              >
                <option value="">
                  Selecione {address1Label.toLowerCase()}
                </option>
                {communityAddressItems.map((item) => (
                  <option key={item.value} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={
                  editing ? (form.address_1 ?? "") : (profile.address_1 ?? "")
                }
                onChange={(e) => handleField("address_1", e.target.value)}
                disabled={!editing}
                placeholder={editing ? address1Placeholder : ""}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-950/60"
              />
            )}
          </Field>

          <Field label="Complemento">
            <input
              value={
                editing ? (form.address_2 ?? "") : (profile.address_2 ?? "")
              }
              onChange={(e) => handleField("address_2", e.target.value)}
              disabled={!editing}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-950/60"
            />
          </Field>

          <Field label="CEP">
            {editing && hasPresetZipcodes ? (
              <select
                value={form.zipcode ?? ""}
                onChange={(e) => handleField("zipcode", e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                required
              >
                <option value="">Selecione o CEP</option>
                {communityZipcodes.map((zipcode) => (
                  <option key={zipcode} value={zipcode}>
                    {zipcode}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={editing ? (form.zipcode ?? "") : (profile.zipcode ?? "")}
                onChange={(e) => handleField("zipcode", e.target.value)}
                disabled={!editing}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-950/60"
              />
            )}
          </Field>

          <Field label="Telefone">
            <input
              value={editing ? (form.phone ?? "") : (profile.phone ?? "")}
              onChange={(e) => handleField("phone", e.target.value)}
              disabled={!editing}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-950/60"
            />
          </Field>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-center lg:justify-end">
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={16} />
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Salvar dados
            </button>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
