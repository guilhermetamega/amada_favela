import type { AssociationFormData } from "@/types/association";
import MediaUploadCard from "@/components/associationSettings/MediaUploadCard";

type Props = {
  form: AssociationFormData;
  saving: boolean;
  uploadingLogo: boolean;
  uploadingSignature: boolean;
  onFieldChange: <K extends keyof AssociationFormData>(
    key: K,
    value: AssociationFormData[K],
  ) => void;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSignatureChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  formatCnpj: (value: string) => string;
  formatZipcode: (value: string) => string;
  formatPhone: (value: string) => string;
};

export default function SettingsForm({
  form,
  saving,
  uploadingLogo,
  uploadingSignature,
  onFieldChange,
  onLogoChange,
  onSignatureChange,
  onSubmit,
  formatCnpj,
  formatZipcode,
  formatPhone,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Dados institucionais
        </h2>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="association-name"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nome da associação
            </label>
            <input
              id="association-name"
              type="text"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="association-cnpj"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              CNPJ
            </label>
            <input
              id="association-cnpj"
              type="text"
              value={form.cnpj}
              onChange={(event) =>
                onFieldChange("cnpj", formatCnpj(event.target.value))
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="association-community"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Comunidade
            </label>
            <input
              id="association-community"
              type="text"
              value={form.community}
              disabled
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="headquarters-address"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Endereço da sede
            </label>
            <input
              id="headquarters-address"
              type="text"
              value={form.headquarters_address}
              onChange={(event) =>
                onFieldChange("headquarters_address", event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="headquarters-number"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Número
            </label>
            <input
              id="headquarters-number"
              type="text"
              value={form.headquarters_number}
              onChange={(event) =>
                onFieldChange("headquarters_number", event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="headquarters-complement"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Complemento
            </label>
            <input
              id="headquarters-complement"
              type="text"
              value={form.headquarters_complement}
              onChange={(event) =>
                onFieldChange("headquarters_complement", event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="headquarters-neighborhood"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Bairro
            </label>
            <input
              id="headquarters-neighborhood"
              type="text"
              value={form.headquarters_neighborhood}
              onChange={(event) =>
                onFieldChange("headquarters_neighborhood", event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="headquarters-city"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Cidade
            </label>
            <input
              id="headquarters-city"
              type="text"
              value={form.headquarters_city}
              onChange={(event) =>
                onFieldChange("headquarters_city", event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="headquarters-state"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              UF
            </label>
            <input
              id="headquarters-state"
              type="text"
              maxLength={2}
              value={form.headquarters_state}
              onChange={(event) =>
                onFieldChange(
                  "headquarters_state",
                  event.target.value.toUpperCase(),
                )
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 uppercase text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="headquarters-zipcode"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              CEP
            </label>
            <input
              id="headquarters-zipcode"
              type="text"
              value={form.headquarters_zipcode}
              onChange={(event) =>
                onFieldChange(
                  "headquarters_zipcode",
                  formatZipcode(event.target.value),
                )
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="association-phone"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Telefone
            </label>
            <input
              id="association-phone"
              type="text"
              value={form.phone}
              onChange={(event) =>
                onFieldChange("phone", formatPhone(event.target.value))
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              placeholder="(21) 99999-9999"
            />
          </div>

          <div>
            <label
              htmlFor="president-name"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nome da presidência
            </label>
            <input
              id="president-name"
              type="text"
              value={form.president_name}
              onChange={(event) =>
                onFieldChange("president_name", event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="president-role"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Cargo exibido
            </label>
            <input
              id="president-role"
              type="text"
              value={form.president_role}
              onChange={(event) =>
                onFieldChange("president_role", event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 gap-5">
            <MediaUploadCard
              id="logo-upload"
              title="Logo da associação"
              loading={uploadingLogo}
              onChange={onLogoChange}
            />

            <MediaUploadCard
              id="signature-upload"
              title="Assinatura institucional"
              description="O arquivo será publicado no bucket privado association_signatures e a tela usará signed URL apenas para preview."
              loading={uploadingSignature}
              onChange={onSignatureChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  onFieldChange("is_active", event.target.checked)
                }
                className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-950"
              />
              Associação ativa
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </form>
  );
}
