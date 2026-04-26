import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/Layout";
import AssociationHero from "@/components/associationSettings/Hero";
import AssociationFeedback from "@/components/associationSettings/Feedback";
import AssociationPageSkeleton from "@/components/associationSettings/PageSkeleton";
import SettingsForm from "@/components/associationSettings/SettingsForm";
import InstitutionalPreview from "@/components/associationSettings/InstitutionalPreview";
import type { AssociationFormData } from "@/types/association";
import {
  createAssociationMercadoPagoConnect,
  createAssociationStripeOnboarding,
  getCurrentAssociationAccess,
  getMyAssociation,
  syncAssociationMercadoPagoStatus,
  syncAssociationStripeOnboardingStatus,
  updateAssociation,
  uploadAssociationLogo,
  uploadAssociationSignature,
} from "@/services/supabase/association";
import { invalidateAssociationContactCache } from "@/services/supabase/association_public";
import MainLayout from "@/components/layout/MainLayout";

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
  monthly_fee: "",
  stripe_connected_account_id: "",
  stripe_onboarding_completed: false,
  mercadopago_user_id: "",
  mercadopago_status: "not_connected",
  mercadopago_connected_at: null,
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
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<AssociationFormData>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [stripeOnboardingLoading, setStripeOnboardingLoading] = useState(false);
  const [stripeStatusSyncing, setStripeStatusSyncing] = useState(false);
  const [mercadopagoConnectLoading, setMercadopagoConnectLoading] =
    useState(false);
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

        try {
          const mercadoPagoStatus = await syncAssociationMercadoPagoStatus();

          if (!active) return;

          setForm((current) => ({
            ...current,
            mercadopago_user_id: mercadoPagoStatus.mercadopago_user_id ?? "",
            mercadopago_status: mercadoPagoStatus.mercadopago_status,
            mercadopago_connected_at:
              mercadoPagoStatus.mercadopago_connected_at,
          }));
        } catch {
          // noop
        }

        setStripeStatusSyncing(true);

        try {
          const stripeStatus = await syncAssociationStripeOnboardingStatus();

          if (!active) return;

          setForm((current) => ({
            ...current,
            stripe_connected_account_id:
              stripeStatus.stripe_connected_account_id ?? "",
            stripe_onboarding_completed:
              stripeStatus.stripe_onboarding_completed,
          }));
        } catch {
          // noop
        } finally {
          if (active) {
            setStripeStatusSyncing(false);
          }
        }
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

  useEffect(() => {
    const stripeFlowState = searchParams.get("stripe");
    const mercadoPagoFlowState = searchParams.get("mercadopago");

    if (!stripeFlowState && !mercadoPagoFlowState) {
      return;
    }

    let active = true;

    async function syncAfterReturn() {
      if (mercadoPagoFlowState === "success") {
        try {
          const [association, mercadoPagoStatus] = await Promise.all([
            getMyAssociation(),
            syncAssociationMercadoPagoStatus(),
          ]);

          if (!active) return;

          setForm((current) => ({
            ...association,
            stripe_connected_account_id: current.stripe_connected_account_id,
            stripe_onboarding_completed: current.stripe_onboarding_completed,
            mercadopago_user_id: mercadoPagoStatus.mercadopago_user_id ?? "",
            mercadopago_status: mercadoPagoStatus.mercadopago_status,
            mercadopago_connected_at:
              mercadoPagoStatus.mercadopago_connected_at,
          }));

          setSuccessMessage("Conta Mercado Pago conectada com sucesso.");
        } catch (error) {
          if (!active) return;

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível atualizar os dados do Mercado Pago.",
          );
        } finally {
          if (active) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          }
        }

        return;
      }

      if (!stripeFlowState) {
        return;
      }

      setStripeStatusSyncing(true);

      try {
        const stripeStatus = await syncAssociationStripeOnboardingStatus();

        if (!active) return;

        setForm((current) => ({
          ...current,
          stripe_connected_account_id:
            stripeStatus.stripe_connected_account_id ?? "",
          stripe_onboarding_completed: stripeStatus.stripe_onboarding_completed,
        }));

        setSuccessMessage(
          stripeStatus.stripe_onboarding_completed
            ? "Onboarding da Stripe concluído com sucesso."
            : "Conta Stripe criada. Continue o onboarding para habilitar os pagamentos.",
        );
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível sincronizar o status da Stripe.",
        );
      } finally {
        if (active) {
          setStripeStatusSyncing(false);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }
    }

    void syncAfterReturn();

    return () => {
      active = false;
    };
  }, [searchParams]);

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

  async function handleStripeOnboardingClick() {
    if (stripeOnboardingLoading || accessDenied) {
      return;
    }

    setStripeOnboardingLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await createAssociationStripeOnboarding();
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o onboarding da Stripe.",
      );
    } finally {
      setStripeOnboardingLoading(false);
    }
  }

  async function handleMercadoPagoConnectClick() {
    if (mercadopagoConnectLoading || accessDenied) {
      return;
    }

    setMercadopagoConnectLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (form.mercadopago_user_id) {
        window.open(
          "https://www.mercadopago.com.br/home",
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      const result = await createAssociationMercadoPagoConnect();
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a conexão com o Mercado Pago.",
      );
    } finally {
      setMercadopagoConnectLoading(false);
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
        monthly_fee: form.monthly_fee,
      });

      setForm((current) => ({
        ...updated,
        stripe_connected_account_id: current.stripe_connected_account_id,
        stripe_onboarding_completed: current.stripe_onboarding_completed,
        mercadopago_user_id: current.mercadopago_user_id,
        mercadopago_status: current.mercadopago_status,
        mercadopago_connected_at: current.mercadopago_connected_at,
      }));

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
      <MainLayout>
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
                stripeOnboardingLoading={stripeOnboardingLoading}
                stripeStatusSyncing={stripeStatusSyncing}
                mercadopagoConnectLoading={mercadopagoConnectLoading}
                onFieldChange={updateField}
                onLogoChange={(event) => void handleLogoChange(event)}
                onSignatureChange={(event) => void handleSignatureChange(event)}
                onSubmit={handleSubmit}
                onStripeOnboardingClick={() => {
                  void handleStripeOnboardingClick();
                }}
                onMercadoPagoConnectClick={() => {
                  void handleMercadoPagoConnectClick();
                }}
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
      </MainLayout>
    </DashboardLayout>
  );
}
