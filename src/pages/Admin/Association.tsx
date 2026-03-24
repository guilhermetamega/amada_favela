import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import type { AssociationFormData } from "@/types/association";
import {
  getCurrentAssociationAccess,
  getMyAssociation,
  updateAssociation,
  uploadAssociationLogo,
  uploadAssociationSignature,
} from "@/services/supabase/association";

const initialForm: AssociationFormData = {
  id: "",
  name: "",
  cnpj: "",
  community: "",
  headquarters_address: "",
  headquarters_number: "",
  headquarters_complement: "",
  headquarters_neighborhood: "",
  headquarters_city: "",
  headquarters_state: "",
  headquarters_zipcode: "",
  logo_path: "",
  logo_url: null,
  signature_path: "",
  signature_url: null,
  president_name: "",
  president_role: "Presidente",
  is_active: true,
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return digits.replace(/^(\d{2})(\d+)/, "$1.$2");
  if (digits.length <= 8) {
    return digits.replace(/^(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  }
  if (digits.length <= 12) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/,
    "$1.$2.$3/$4-$5",
  );
}

function formatZipcode(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) return digits;

  return digits.replace(/^(\d{5})(\d+)/, "$1-$2");
}

export default function AssociationSettingsPage() {
  const [form, setForm] = useState<AssociationFormData>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const access = await getCurrentAssociationAccess();

        if (!active) return;

        if (!access.allowed) {
          setAccessDenied(true);
          setErrorMessage(
            access.reason ||
              "Você não tem permissão para editar os dados da associação.",
          );
          return;
        }

        const association = await getMyAssociation();

        if (!active) return;

        setAccessDenied(false);
        setForm(association);
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados da associação.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const institutionalAddressPreview = useMemo(() => {
    return [
      form.headquarters_address,
      form.headquarters_number,
      form.headquarters_complement,
      form.headquarters_neighborhood,
      form.headquarters_city
        ? `${form.headquarters_city} - ${form.headquarters_state}`
        : form.headquarters_state,
      form.headquarters_zipcode ? `CEP ${form.headquarters_zipcode}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
  }, [
    form.headquarters_address,
    form.headquarters_number,
    form.headquarters_complement,
    form.headquarters_neighborhood,
    form.headquarters_city,
    form.headquarters_state,
    form.headquarters_zipcode,
  ]);

  function updateField<K extends keyof AssociationFormData>(
    key: K,
    value: AssociationFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !form.community) return;

    setUploadingLogo(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const uploaded = await uploadAssociationLogo(file, form.community);

      setForm((current) => ({
        ...current,
        logo_path: uploaded.logoPath,
        logo_url: uploaded.logoUrl,
      }));

      setSuccessMessage("Logo atualizada no formulário.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a logo.",
      );
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  async function handleSignatureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !form.community) return;

    setUploadingSignature(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const uploaded = await uploadAssociationSignature(file, form.community);

      setForm((current) => ({
        ...current,
        signature_path: uploaded.signaturePath,
        signature_url: uploaded.signatureUrl,
      }));

      setSuccessMessage("Assinatura atualizada no formulário.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a assinatura.",
      );
    } finally {
      setUploadingSignature(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || accessDenied) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await updateAssociation({
        id: form.id,
        name: form.name,
        cnpj: form.cnpj,
        headquarters_address: form.headquarters_address,
        headquarters_number: form.headquarters_number,
        headquarters_complement: form.headquarters_complement,
        headquarters_neighborhood: form.headquarters_neighborhood,
        headquarters_city: form.headquarters_city,
        headquarters_state: form.headquarters_state,
        headquarters_zipcode: form.headquarters_zipcode,
        logo_path: form.logo_path,
        signature_path: form.signature_path,
        president_name: form.president_name,
        president_role: form.president_role,
        is_active: form.is_active,
      });

      setForm(updated);
      setSuccessMessage("Dados da associação atualizados com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a associação.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <DashboardHeader
            title="Configurações da Associação"
            description="Gerencie os dados institucionais usados em documentos e telas do sistema."
            showBackButton
          />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Carregando dados da associação...
            </div>
          ) : null}

          {!loading && accessDenied ? (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-700 dark:text-amber-300">
              Apenas president e admin podem acessar esta área.
            </div>
          ) : null}

          {!loading && !accessDenied ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
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
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField("cnpj", formatCnpj(event.target.value))
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField("headquarters_address", event.target.value)
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField("headquarters_number", event.target.value)
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField(
                          "headquarters_complement",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField(
                          "headquarters_neighborhood",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField("headquarters_city", event.target.value)
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField(
                          "headquarters_state",
                          event.target.value.toUpperCase(),
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 uppercase outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField(
                          "headquarters_zipcode",
                          formatZipcode(event.target.value),
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      required
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
                        updateField("president_name", event.target.value)
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        updateField("president_role", event.target.value)
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="logo-upload"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Logo da associação
                    </label>

                    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleLogoChange(event)}
                        className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-white dark:file:text-zinc-900"
                      />

                      {uploadingLogo ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Enviando logo...
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="signature-upload"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Assinatura institucional
                    </label>

                    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
                      <input
                        id="signature-upload"
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleSignatureChange(event)}
                        className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-white dark:file:text-zinc-900"
                      />

                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        O arquivo será publicado no bucket privado
                        <span className="mx-1 font-semibold">
                          association_signatures
                        </span>
                        e a tela usará signed URL apenas para preview.
                      </p>

                      {uploadingSignature ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Enviando assinatura...
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="inline-flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) =>
                          updateField("is_active", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                      Associação ativa
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>

              <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Preview institucional
                </h2>

                <div className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-950">
                  <div className="flex items-start gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt="Logo da associação"
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Logo
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {form.name || "Nome da associação"}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        CNPJ {form.cnpj || "-"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {institutionalAddressPreview ||
                          "Endereço institucional"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Presidência
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {form.president_name || "-"}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {form.president_role || "Presidente"}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Prévia da assinatura
                    </p>

                    <div className="mt-3 flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                      {form.signature_url ? (
                        <img
                          src={form.signature_url}
                          alt="Assinatura institucional"
                          className="max-h-24 max-w-full object-contain"
                        />
                      ) : (
                        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                          Envie um arquivo de assinatura para visualizar aqui.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Status
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        form.is_active
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {form.is_active ? "Ativa" : "Inativa"}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
