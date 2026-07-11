import type { ChangeEvent, FormEvent } from "react";

import MediaUploadCard from "@/components/associationSettings/MediaUploadCard";
import type { AssociationFormData } from "@/types/association";

type Props = {
  form: AssociationFormData;
  saving: boolean;
  uploadingLogo: boolean;
  uploadingSignature: boolean;
  stripeOnboardingLoading: boolean;
  stripeStatusSyncing: boolean;
  mercadopagoConnectLoading: boolean;

  onFieldChange: <K extends keyof AssociationFormData>(
    key: K,
    value: AssociationFormData[K],
  ) => void;

  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;

  onSignatureChange: (event: ChangeEvent<HTMLInputElement>) => void;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  onStripeOnboardingClick: () => void;
  onMercadoPagoConnectClick: () => void;

  formatCnpj: (value: string) => string;
  formatZipcode: (value: string) => string;
  formatPhone: (value: string) => string;
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900";

const disabledInputClassName =
  "w-full cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";

const labelClassName =
  "mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

function getStripeBadge(form: AssociationFormData) {
  if (!form.id) {
    return {
      label: "Salve a associação primeiro",
      className:
        "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    };
  }

  if (!form.stripe_connected_account_id) {
    return {
      label: "Conta não criada",
      className:
        "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    };
  }

  if (form.stripe_onboarding_completed) {
    return {
      label: "Habilitado para pagamentos",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  return {
    label: "Onboarding pendente",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };
}

function getMercadoPagoBadge(form: AssociationFormData) {
  if (!form.id) {
    return {
      label: "Salve a associação primeiro",
      className:
        "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    };
  }

  if (!form.mercadopago_user_id) {
    return {
      label: "Conta não conectada",
      className:
        "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    };
  }

  if (form.mercadopago_status === "active") {
    return {
      label: "Habilitado para pagamentos",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (form.mercadopago_status === "expired") {
    return {
      label: "Conexão expirada",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    label: "Conexão revogada",
    className: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  };
}

export default function SettingsForm({
  form,
  saving,
  uploadingLogo,
  uploadingSignature,
  stripeOnboardingLoading,
  stripeStatusSyncing,
  mercadopagoConnectLoading,
  onFieldChange,
  onLogoChange,
  onSignatureChange,
  onSubmit,
  onStripeOnboardingClick,
  onMercadoPagoConnectClick,
  formatCnpj,
  formatZipcode,
  formatPhone,
}: Props) {
  const associationExists = Boolean(form.id);

  const stripeBadge = getStripeBadge(form);
  const mercadoPagoBadge = getMercadoPagoBadge(form);

  const isUploading = uploadingLogo || uploadingSignature;

  const submitDisabled = saving || isUploading;

  const stripeButtonDisabled =
    !associationExists || stripeOnboardingLoading || stripeStatusSyncing;

  const mercadoPagoButtonDisabled =
    !associationExists || mercadopagoConnectLoading;

  const onboardingButtonLabel = form.stripe_connected_account_id
    ? form.stripe_onboarding_completed
      ? "Abrir painel Stripe Express"
      : "Continuar onboarding na Stripe"
    : "Criar conta Express na Stripe";

  const mercadoPagoButtonLabel = form.mercadopago_user_id
    ? "Abrir Mercado Pago"
    : "Conectar Mercado Pago";

  const submitButtonLabel = saving
    ? associationExists
      ? "Salvando..."
      : "Criando associação..."
    : associationExists
      ? "Salvar alterações"
      : "Criar associação";

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={saving}
      className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
            Dados institucionais
          </h2>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {associationExists
              ? "Atualize as informações institucionais da associação."
              : "Preencha os dados abaixo para cadastrar a associação desta comunidade."}
          </p>
        </div>
      </div>

      <div className="space-y-8 p-4 sm:p-5">
        <section className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="association-name" className={labelClassName}>
                Nome da associação
              </label>

              <input
                id="association-name"
                type="text"
                value={form.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                className={inputClassName}
                autoComplete="organization"
                required
              />
            </div>

            <div>
              <label htmlFor="association-cnpj" className={labelClassName}>
                CNPJ
              </label>

              <input
                id="association-cnpj"
                type="text"
                inputMode="numeric"
                maxLength={18}
                value={form.cnpj}
                onChange={(event) =>
                  onFieldChange("cnpj", formatCnpj(event.target.value))
                }
                className={inputClassName}
                placeholder="00.000.000/0000-00"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="association-community" className={labelClassName}>
                Comunidade
              </label>

              <input
                id="association-community"
                type="text"
                value={form.community}
                disabled
                className={disabledInputClassName}
              />

              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                A comunidade é definida pelo perfil do presidente ou
                administrador conectado.
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="headquarters-address" className={labelClassName}>
                Endereço da sede
              </label>

              <input
                id="headquarters-address"
                type="text"
                value={form.headquarters_address}
                onChange={(event) =>
                  onFieldChange("headquarters_address", event.target.value)
                }
                className={inputClassName}
                autoComplete="street-address"
                required
              />
            </div>

            <div>
              <label htmlFor="headquarters-number" className={labelClassName}>
                Número
              </label>

              <input
                id="headquarters-number"
                type="text"
                value={form.headquarters_number}
                onChange={(event) =>
                  onFieldChange("headquarters_number", event.target.value)
                }
                className={inputClassName}
                autoComplete="address-line2"
              />
            </div>

            <div>
              <label
                htmlFor="headquarters-complement"
                className={labelClassName}
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
                className={inputClassName}
                placeholder="Sala, bloco, referência..."
              />
            </div>

            <div>
              <label
                htmlFor="headquarters-neighborhood"
                className={labelClassName}
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
                className={inputClassName}
                autoComplete="address-level3"
              />
            </div>

            <div>
              <label htmlFor="headquarters-city" className={labelClassName}>
                Cidade
              </label>

              <input
                id="headquarters-city"
                type="text"
                value={form.headquarters_city}
                onChange={(event) =>
                  onFieldChange("headquarters_city", event.target.value)
                }
                className={inputClassName}
                autoComplete="address-level2"
                required
              />
            </div>

            <div>
              <label htmlFor="headquarters-state" className={labelClassName}>
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
                className={`${inputClassName} uppercase`}
                placeholder="RJ"
                autoComplete="address-level1"
                required
              />
            </div>

            <div>
              <label htmlFor="headquarters-zipcode" className={labelClassName}>
                CEP
              </label>

              <input
                id="headquarters-zipcode"
                type="text"
                inputMode="numeric"
                maxLength={9}
                value={form.headquarters_zipcode}
                onChange={(event) =>
                  onFieldChange(
                    "headquarters_zipcode",
                    formatZipcode(event.target.value),
                  )
                }
                className={inputClassName}
                placeholder="00000-000"
                autoComplete="postal-code"
                required
              />
            </div>

            <div>
              <label htmlFor="association-phone" className={labelClassName}>
                Telefone
              </label>

              <input
                id="association-phone"
                type="text"
                inputMode="tel"
                maxLength={15}
                value={form.phone}
                onChange={(event) =>
                  onFieldChange("phone", formatPhone(event.target.value))
                }
                className={inputClassName}
                placeholder="(21) 99999-9999"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="president-name" className={labelClassName}>
                Nome da presidência
              </label>

              <input
                id="president-name"
                type="text"
                value={form.president_name}
                onChange={(event) =>
                  onFieldChange("president_name", event.target.value)
                }
                className={inputClassName}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="president-role" className={labelClassName}>
                Cargo exibido
              </label>

              <input
                id="president-role"
                type="text"
                value={form.president_role}
                onChange={(event) =>
                  onFieldChange("president_role", event.target.value)
                }
                className={inputClassName}
                placeholder="Presidente"
              />
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Mensalidade e gateways
            </h3>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Defina o valor da mensalidade e conecte os meios de recebimento da
              associação.
            </p>
          </div>

          {!associationExists ? (
            <div
              role="status"
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
            >
              Preencha os dados institucionais e crie a associação antes de
              conectar Stripe ou Mercado Pago.
            </div>
          ) : null}

          <div>
            <label htmlFor="association-monthly-fee" className={labelClassName}>
              Mensalidade
            </label>

            <div className="relative max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                R$
              </span>

              <input
                id="association-monthly-fee"
                type="text"
                inputMode="decimal"
                value={form.monthly_fee}
                onChange={(event) =>
                  onFieldChange("monthly_fee", event.target.value)
                }
                className={`${inputClassName} pl-12`}
                placeholder="49,90"
              />
            </div>

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Informe o valor bruto cobrado do associado em reais.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stripeBadge.className}`}
                >
                  {stripeBadge.label}
                </span>

                {stripeStatusSyncing ? (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Sincronizando status...
                  </span>
                ) : null}
              </div>

              <div className="flex-1">
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {!associationExists
                    ? "A conta Stripe poderá ser configurada após a criação da associação."
                    : form.stripe_connected_account_id
                      ? "A associação já possui uma conta conectada. Continue o onboarding ou abra o painel Express."
                      : "Crie a conta Express da associação para habilitar o onboarding e os pagamentos."}
                </p>

                {form.stripe_connected_account_id ? (
                  <p className="mt-2 break-all text-xs text-zinc-500 dark:text-zinc-400">
                    {form.stripe_connected_account_id}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onStripeOnboardingClick}
                disabled={stripeButtonDisabled}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {stripeOnboardingLoading
                  ? "Abrindo Stripe..."
                  : stripeStatusSyncing
                    ? "Sincronizando..."
                    : onboardingButtonLabel}
              </button>
            </div>

            <div className="flex flex-col rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${mercadoPagoBadge.className}`}
                >
                  {mercadoPagoBadge.label}
                </span>
              </div>

              <div className="flex-1">
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {!associationExists
                    ? "O Mercado Pago poderá ser conectado após a criação da associação."
                    : form.mercadopago_user_id
                      ? "A associação já está vinculada ao Mercado Pago. Abra a conta para acompanhar saldo, recebimentos e movimentações."
                      : "Conecte a conta Mercado Pago da associação para habilitar o Pix via marketplace."}
                </p>

                {form.mercadopago_user_id ? (
                  <p className="mt-2 break-all text-xs text-zinc-500 dark:text-zinc-400">
                    Seller ID: {form.mercadopago_user_id}
                  </p>
                ) : null}

                {form.mercadopago_connected_at ? (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Conectado em{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(form.mercadopago_connected_at))}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onMercadoPagoConnectClick}
                disabled={mercadoPagoButtonDisabled}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mercadopagoConnectLoading
                  ? "Abrindo Mercado Pago..."
                  : mercadoPagoButtonLabel}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Identidade institucional
            </h3>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Envie a logo e a assinatura utilizadas nos documentos da
              associação.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <MediaUploadCard
              id="logo-upload"
              title="Logo da associação"
              loading={uploadingLogo}
              onChange={onLogoChange}
            />

            <MediaUploadCard
              id="signature-upload"
              title="Assinatura institucional"
              description="O arquivo será armazenado no bucket privado association_signatures e será exibido por uma URL assinada."
              loading={uploadingSignature}
              onChange={onSignatureChange}
            />
          </div>
        </section>

        <section className="space-y-5 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Status da associação
            </h3>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Associações inativas continuam disponíveis para edição, mas deixam
              de aparecer nos fluxos públicos que exigem uma associação ativa.
            </p>
          </div>

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
        </section>

        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {isUploading
              ? "Aguarde o envio dos arquivos antes de salvar."
              : associationExists
                ? "As alterações serão aplicadas à associação desta comunidade."
                : "Um novo registro será criado para esta comunidade."}
          </div>

          <button
            type="submit"
            disabled={submitDisabled}
            className="inline-flex min-w-44 items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitButtonLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
