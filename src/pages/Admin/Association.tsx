import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import DashboardLayout from "@/components/layout/Layout";
import AssociationHero from "@/components/associationSettings/Hero";
import AssociationFeedback from "@/components/associationSettings/Feedback";
import AssociationPageSkeleton from "@/components/associationSettings/PageSkeleton";
import SettingsForm from "@/components/associationSettings/SettingsForm";
import InstitutionalPreview from "@/components/associationSettings/InstitutionalPreview";
import type { AssociationFormData } from "@/types/association";
import {
  getCurrentAssociationAccess,
  getMyAssociation,
  updateAssociation,
  uploadAssociationLogo,
  uploadAssociationSignature,
} from "@/services/supabase/association";
import { invalidateAssociationContactCache } from "@/services/supabase/association_public";

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
  phone: "",
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

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return digits.replace(/^(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }

  return digits.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
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
        phone: form.phone,
        logo_path: form.logo_path,
        signature_path: form.signature_path,
        president_name: form.president_name,
        president_role: form.president_role,
        is_active: form.is_active,
      });

      setForm(updated);
      if (updated.community) {
        invalidateAssociationContactCache(updated.community);
      }
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
      <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <AssociationHero />

          <AssociationFeedback
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          {loading ? <AssociationPageSkeleton /> : null}

          {!loading && accessDenied ? (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-sm text-amber-700 dark:text-amber-300">
              Apenas president e admin podem acessar esta área.
            </div>
          ) : null}

          {!loading && !accessDenied ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <SettingsForm
                form={form}
                saving={saving}
                uploadingLogo={uploadingLogo}
                uploadingSignature={uploadingSignature}
                onFieldChange={updateField}
                onLogoChange={(event) => void handleLogoChange(event)}
                onSignatureChange={(event) => void handleSignatureChange(event)}
                onSubmit={handleSubmit}
                formatCnpj={formatCnpj}
                formatZipcode={formatZipcode}
                formatPhone={formatPhone}
              />

              <InstitutionalPreview
                name={form.name}
                cnpj={form.cnpj}
                phone={form.phone}
                addressPreview={institutionalAddressPreview}
                logoUrl={form.logo_url}
                signatureUrl={form.signature_url}
                presidentName={form.president_name}
                presidentRole={form.president_role}
                isActive={form.is_active}
              />
            </div>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
