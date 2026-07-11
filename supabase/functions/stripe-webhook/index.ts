import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const kayoAccountId = Deno.env.get("STRIPE_KAYO_ACCOUNT_ID");

const LOG_PREFIX = "[stripe-webhook]";

if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  throw new Error("Secrets obrigatórios do webhook não configurados.");
}

const stripe = new Stripe(stripeSecret);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

type JsonObject = Record<string, unknown>;

type PaymentRow = {
  id: string;
  user_id: string;
  association_id: string;
  connected_account_id: string | null;
  community: string | null;
  amount_total: number;
  amount_platform_fee: number;
  amount_platform_transfer: number;
  amount_third_party_transfer: number;
  amount_association_transfer: number;
  amount_stripe_fee: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_balance_transaction_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_event_id: string | null;
  payment_method_type: string | null;
  checkout_mode: string | null;
  transfer_group: string | null;
  stripe_platform_transfer_id: string | null;
  stripe_third_party_transfer_id: string | null;
  stripe_association_transfer_id: string | null;
  platform_transfer_destination_account_id: string | null;
  third_party_transfer_destination_account_id: string | null;
  association_transfer_destination_account_id: string | null;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  description: string | null;
  external_reference: string | null;
  metadata: JsonObject | null;
  gateway_response: JsonObject | null;
};

type AssociationRow = {
  id: string;
  name: string;
  community: string;
  stripe_third_party_account_id: string | null;
  stripe_third_party_label: string | null;
};

type ConnectedAccountRow = {
  id: string;
  stripe_account_id: string | null;
  onboarding_completed: boolean;
  payouts_enabled: boolean;
  charges_enabled: boolean;
};

type BillingConfig = {
  association: AssociationRow;
  connectedAccount: ConnectedAccountRow;
};

type PartnerRow = {
  id: string;
  status: string | null;
  expires_at: string;
};

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function addMonthIso(baseIso: string) {
  const date = new Date(baseIso);

  if (Number.isNaN(date.getTime())) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function buildReferenceMonth(
  periodStartIso: string | null,
  fallbackIso: string,
) {
  const base = periodStartIso
    ? new Date(periodStartIso)
    : new Date(fallbackIso);

  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-01`;
}

function determinePaymentMethodType(charge: Stripe.Charge): string {
  const details = charge.payment_method_details;

  if (!details) {
    return "unknown";
  }

  if (details.type === "card") {
    const walletType = details.card?.wallet?.type;

    if (walletType === "apple_pay") {
      return "apple_pay";
    }

    if (walletType === "google_pay") {
      return "google_pay";
    }

    return "card";
  }

  if (details.type === "boleto") {
    return "boleto";
  }

  if (details.type === "pix") {
    return "pix";
  }

  if (details.type === "link") {
    return "link";
  }

  return "unknown";
}

function normalizeSnapshotCents(value: unknown, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Snapshot financeiro inválido: ${fieldName}.`);
  }

  return parsed;
}

async function getBillingConfig(associationId: string): Promise<BillingConfig> {
  const { data: associationData, error: associationError } = await admin
    .from("association")
    .select(
      `
        id,
        name,
        community,
        stripe_third_party_account_id,
        stripe_third_party_label
      `,
    )
    .eq("id", associationId)
    .single();

  if (associationError || !associationData) {
    throw new Error(
      associationError?.message ||
        "Associação não encontrada ao processar webhook.",
    );
  }

  const { data: connectedAccountData, error: connectedAccountError } =
    await admin
      .from("connected_accounts")
      .select(
        `
        id,
        stripe_account_id,
        onboarding_completed,
        payouts_enabled,
        charges_enabled
      `,
      )
      .eq("association_id", associationId)
      .single();

  if (connectedAccountError || !connectedAccountData) {
    throw new Error(
      connectedAccountError?.message ||
        "Conta conectada não encontrada ao processar webhook.",
    );
  }

  const connectedAccount = connectedAccountData as ConnectedAccountRow;

  if (!connectedAccount.stripe_account_id) {
    throw new Error("Conta conectada sem stripe_account_id.");
  }

  return {
    association: associationData as AssociationRow,
    connectedAccount,
  };
}

const PAYMENT_SELECT = `
  id,
  user_id,
  association_id,
  connected_account_id,
  community,
  amount_total,
  amount_platform_fee,
  amount_platform_transfer,
  amount_third_party_transfer,
  amount_association_transfer,
  amount_stripe_fee,
  currency,
  stripe_payment_intent_id,
  stripe_charge_id,
  stripe_balance_transaction_id,
  stripe_checkout_session_id,
  stripe_invoice_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_event_id,
  payment_method_type,
  checkout_mode,
  transfer_group,
  stripe_platform_transfer_id,
  stripe_third_party_transfer_id,
  stripe_association_transfer_id,
  platform_transfer_destination_account_id,
  third_party_transfer_destination_account_id,
  association_transfer_destination_account_id,
  paid_at,
  period_start,
  period_end,
  status,
  description,
  external_reference,
  metadata,
  gateway_response
`;

async function updatePaymentById(
  paymentId: string,
  payload: Partial<PaymentRow> & Record<string, unknown>,
) {
  const { data, error } = await admin
    .from("payments")
    .update({
      ...payload,
      updated_at: nowIso(),
    })
    .eq("id", paymentId)
    .select(PAYMENT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Falha ao atualizar payment.");
  }

  return data as PaymentRow;
}

async function getPaymentByCheckoutSession(sessionId: string) {
  const { data, error } = await admin
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("stripe_checkout_session_id", sessionId)
    .eq("purpose", "partner_membership")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as PaymentRow | null;
}

async function getPaymentByInvoice(invoiceId: string) {
  const { data, error } = await admin
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("stripe_invoice_id", invoiceId)
    .eq("purpose", "partner_membership")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as PaymentRow | null;
}

async function getPaymentByPaymentIntent(paymentIntentId: string) {
  const { data, error } = await admin
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("purpose", "partner_membership")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as PaymentRow | null;
}

async function getLatestPaymentBySubscription(subscriptionId: string) {
  const { data, error } = await admin
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("stripe_subscription_id", subscriptionId)
    .eq("purpose", "partner_membership")
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as PaymentRow | null;
}

async function getLatestOpenSubscriptionPaymentByCustomer(customerId: string) {
  const { data, error } = await admin
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("stripe_customer_id", customerId)
    .eq("purpose", "partner_membership")
    .eq("checkout_mode", "subscription")
    .in("status", ["pending", "processing", "requires_action"])
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as PaymentRow | null;
}

async function getOrCreatePaymentForInvoice(
  subscriptionId: string,
  invoice: Stripe.Invoice,
) {
  const existingInvoicePayment = await getPaymentByInvoice(invoice.id);

  if (existingInvoicePayment) {
    return existingInvoicePayment;
  }

  let latestPayment = await getLatestPaymentBySubscription(subscriptionId);

  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : null;

  if (!latestPayment && customerId) {
    latestPayment =
      await getLatestOpenSubscriptionPaymentByCustomer(customerId);
  }

  if (!latestPayment) {
    return null;
  }

  const amountTotal =
    typeof invoice.amount_paid === "number" && invoice.amount_paid > 0
      ? invoice.amount_paid
      : typeof invoice.amount_due === "number" && invoice.amount_due > 0
        ? invoice.amount_due
        : latestPayment.amount_total;

  if (!latestPayment.stripe_invoice_id) {
    return await updatePaymentById(latestPayment.id, {
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      amount_total: amountTotal,
      status: "processing",
      stripe_event_id: null,
    });
  }

  const referenceMonth = invoice.period_start
    ? buildReferenceMonth(
        new Date(invoice.period_start * 1000).toISOString(),
        nowIso(),
      )
    : buildReferenceMonth(latestPayment.period_start, nowIso());

  const { data, error } = await admin
    .from("payments")
    .insert({
      user_id: latestPayment.user_id,
      association_id: latestPayment.association_id,
      connected_account_id: latestPayment.connected_account_id,
      provider: "stripe",
      purpose: "partner_membership",
      payment_method_type: latestPayment.payment_method_type,
      status: "processing",
      currency: latestPayment.currency || "brl",
      amount_total: amountTotal,

      /*
       * Snapshot financeiro:
       * cobranças recorrentes herdam a taxa
       * registrada no pagamento anterior.
       */
      amount_platform_fee: latestPayment.amount_platform_fee,
      amount_platform_transfer: latestPayment.amount_platform_transfer,
      amount_third_party_transfer: latestPayment.amount_third_party_transfer,

      amount_association_transfer: 0,
      amount_stripe_fee: 0,
      reference_month: referenceMonth,
      period_start: null,
      period_end: null,
      description:
        latestPayment.description ||
        `Mensalidade recorrente - ${latestPayment.community ?? "associação"}`,
      paid_at: null,
      stripe_payment_intent_id: null,
      stripe_checkout_session_id: latestPayment.stripe_checkout_session_id,
      stripe_charge_id: null,
      stripe_transfer_id: null,
      stripe_balance_transaction_id: null,
      stripe_customer_id: latestPayment.stripe_customer_id,
      stripe_invoice_id: invoice.id,
      external_reference: `partner_membership:invoice:${invoice.id}`,
      metadata: {
        ...(latestPayment.metadata ?? {}),
        source: "invoice.paid",
        cloned_from_payment_id: latestPayment.id,
      },
      gateway_response: {
        ...(latestPayment.gateway_response ?? {}),
        created_from_invoice_paid: true,
      },
      community: latestPayment.community,
      checkout_mode: "subscription",
      stripe_subscription_id: subscriptionId,
      stripe_event_id: null,
      transfer_group:
        latestPayment.transfer_group ||
        `partner_membership_${latestPayment.user_id}_${Date.now()}`,
      stripe_platform_transfer_id: null,
      stripe_third_party_transfer_id: null,
      stripe_association_transfer_id: null,
      platform_transfer_destination_account_id:
        latestPayment.platform_transfer_destination_account_id,
      third_party_transfer_destination_account_id:
        latestPayment.third_party_transfer_destination_account_id,
      association_transfer_destination_account_id:
        latestPayment.association_transfer_destination_account_id,
      created_by: null,
      updated_by: null,
    })
    .select(PAYMENT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Falha ao criar cobrança recorrente.");
  }

  return data as PaymentRow;
}

async function resolveChargeFromPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge.balance_transaction"],
  });

  if (!paymentIntent.latest_charge) {
    throw new Error("PaymentIntent sem latest_charge.");
  }

  if (typeof paymentIntent.latest_charge === "string") {
    return await stripe.charges.retrieve(paymentIntent.latest_charge, {
      expand: ["balance_transaction"],
    });
  }

  return paymentIntent.latest_charge as Stripe.Charge;
}

function extractPaymentIntentIdFromInvoiceObject(
  invoice: Stripe.Invoice,
): string | null {
  const legacyTopLevel = (
    invoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    }
  ).payment_intent;

  if (typeof legacyTopLevel === "string" && legacyTopLevel.length > 0) {
    return legacyTopLevel;
  }

  const payments = (
    invoice as Stripe.Invoice & {
      payments?: {
        data?: Array<{
          payment?: {
            type?: string | null;
            payment_intent?: string | null;
          } | null;
        }>;
      };
    }
  ).payments?.data;

  if (!Array.isArray(payments)) {
    return null;
  }

  for (const item of payments) {
    const payment = item?.payment;

    if (
      payment?.type === "payment_intent" &&
      typeof payment.payment_intent === "string" &&
      payment.payment_intent.length > 0
    ) {
      return payment.payment_intent;
    }
  }

  return null;
}

async function resolvePaymentIntentIdFromInvoice(
  invoice: Stripe.Invoice,
): Promise<string | null> {
  const direct = extractPaymentIntentIdFromInvoiceObject(invoice);

  if (direct) {
    log("invoice:payment-intent-resolved:embedded", {
      invoiceId: invoice.id,
      paymentIntentId: direct,
    });

    return direct;
  }

  const refreshed = await stripe.invoices.retrieve(invoice.id, {
    expand: ["payments"],
  });

  const refreshedId = extractPaymentIntentIdFromInvoiceObject(
    refreshed as Stripe.Invoice,
  );

  log("invoice:payment-intent-resolved:refreshed", {
    invoiceId: invoice.id,
    paymentIntentId: refreshedId,
  });

  return refreshedId;
}

async function resolveInvoiceFromInvoicePayment(
  invoicePayment: Stripe.InvoicePayment,
): Promise<{
  invoice: Stripe.Invoice;
  paymentIntentId: string | null;
} | null> {
  const invoiceId =
    typeof invoicePayment.invoice === "string"
      ? invoicePayment.invoice
      : (invoicePayment.invoice?.id ?? null);

  if (!invoiceId) {
    log("invoice-payment:missing-invoice-id", {
      invoicePaymentId: invoicePayment.id,
    });

    return null;
  }

  const paymentIntentId =
    invoicePayment.payment?.type === "payment_intent" &&
    typeof invoicePayment.payment.payment_intent === "string"
      ? invoicePayment.payment.payment_intent
      : null;

  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ["payments"],
  });

  log("invoice-payment:resolved", {
    invoicePaymentId: invoicePayment.id,
    invoiceId,
    paymentIntentId,
  });

  return {
    invoice,
    paymentIntentId,
  };
}

async function syncPartnerEntitlement(params: {
  payment: PaymentRow;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
}) {
  const partnerPayload = {
    user_id: params.payment.user_id,
    association_id: params.payment.association_id,
    payment_id: params.payment.id,
    stripe_subscription_id: params.payment.stripe_subscription_id,
    stripe_payment_intent_id: params.payment.stripe_payment_intent_id,
    stripe_checkout_session_id: params.payment.stripe_checkout_session_id,
    payment_status: "paid",
    created_at: params.paidAt,
    expires_at: params.periodEnd,
    status: "active",
  };

  const { data: existingPartner, error: existingPartnerError } = await admin
    .from("partners")
    .select("id")
    .eq("payment_id", params.payment.id)
    .maybeSingle();

  if (existingPartnerError) {
    throw new Error(existingPartnerError.message);
  }

  if (existingPartner?.id) {
    const { error } = await admin
      .from("partners")
      .update(partnerPayload)
      .eq("id", existingPartner.id);

    if (error) {
      throw new Error(error.message);
    }

    log("partner:updated", {
      partnerId: existingPartner.id,
      paymentId: params.payment.id,
      expiresAt: params.periodEnd,
    });

    return;
  }

  const { error } = await admin.from("partners").insert(partnerPayload);

  if (error) {
    throw new Error(error.message);
  }

  log("partner:inserted", {
    paymentId: params.payment.id,
    expiresAt: params.periodEnd,
  });
}

async function markLatestPartnerPastDueBySubscription(subscriptionId: string) {
  const { data, error } = await admin
    .from("partners")
    .select("id, status, expires_at")
    .eq("stripe_subscription_id", subscriptionId)
    .in("status", ["active", "past_due"])
    .order("expires_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const partner = (data ?? null) as PartnerRow | null;

  if (!partner) {
    return;
  }

  const { error: updateError } = await admin
    .from("partners")
    .update({
      status: "past_due",
      payment_status: "past_due",
    })
    .eq("id", partner.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  log("partner:past-due", {
    partnerId: partner.id,
    subscriptionId,
  });
}

async function cancelPartnersBySubscription(subscriptionId: string) {
  const { error } = await admin
    .from("partners")
    .update({
      status: "cancelled",
      payment_status: "cancelled",
    })
    .eq("stripe_subscription_id", subscriptionId)
    .in("status", ["active", "past_due"]);

  if (error) {
    throw new Error(error.message);
  }

  log("partner:cancelled", {
    subscriptionId,
  });
}

async function ensureTransfersAndPersist(params: {
  payment: PaymentRow;
  paymentIntentId: string;
  charge: Stripe.Charge;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  eventId: string | null;
}) {
  const billingConfig = await getBillingConfig(params.payment.association_id);

  const balanceTx = params.charge.balance_transaction as
    | Stripe.BalanceTransaction
    | string
    | null;

  if (!balanceTx || typeof balanceTx === "string") {
    throw new Error("Charge sem balance_transaction expandido.");
  }

  const fee = balanceTx.fee ?? 0;
  const gross = params.charge.amount;
  const net = gross - fee;

  /*
   * Os valores abaixo são snapshots gravados
   * quando o checkout/pagamento foi criado.
   * O webhook não consulta a taxa atual da
   * associação, evitando alteração retroativa.
   */
  const platformRetainedCents = normalizeSnapshotCents(
    params.payment.amount_platform_fee,
    "amount_platform_fee",
  );

  const platformTransferCents = normalizeSnapshotCents(
    params.payment.amount_platform_transfer,
    "amount_platform_transfer",
  );

  const thirdPartyTransferCents = normalizeSnapshotCents(
    params.payment.amount_third_party_transfer,
    "amount_third_party_transfer",
  );

  const associationTransferCents =
    net -
    platformRetainedCents -
    platformTransferCents -
    thirdPartyTransferCents;

  if (associationTransferCents <= 0) {
    throw new Error(
      "Valor líquido insuficiente para executar o split configurado.",
    );
  }

  const platformDestination =
    params.payment.platform_transfer_destination_account_id ?? kayoAccountId;

  const thirdPartyDestination =
    params.payment.third_party_transfer_destination_account_id ??
    billingConfig.association.stripe_third_party_account_id;

  const associationDestination =
    params.payment.association_transfer_destination_account_id ??
    billingConfig.connectedAccount.stripe_account_id;

  if (platformTransferCents > 0 && !platformDestination) {
    throw new Error(
      "Conta de destino do parceiro da plataforma não configurada.",
    );
  }

  if (thirdPartyTransferCents > 0 && !thirdPartyDestination) {
    throw new Error("Conta de destino do terceiro não configurada.");
  }

  if (!associationDestination) {
    throw new Error("Conta de destino da associação não configurada.");
  }

  let platformTransferId = params.payment.stripe_platform_transfer_id;

  let thirdPartyTransferId = params.payment.stripe_third_party_transfer_id;

  let associationTransferId = params.payment.stripe_association_transfer_id;

  if (platformTransferCents > 0 && !platformTransferId) {
    const transfer = await stripe.transfers.create(
      {
        amount: platformTransferCents,
        currency: "brl",
        destination: platformDestination!,
        transfer_group:
          params.payment.transfer_group ??
          `partner_membership_${params.payment.user_id}_${Date.now()}`,
        source_transaction: params.charge.id,
        metadata: {
          payment_id: params.payment.id,
          recipient_type: "platform",
        },
      },
      {
        idempotencyKey: `payment:${params.payment.id}:platform-transfer:v1`,
      },
    );

    platformTransferId = transfer.id;
  }

  if (
    thirdPartyTransferCents > 0 &&
    thirdPartyDestination &&
    !thirdPartyTransferId
  ) {
    const transfer = await stripe.transfers.create(
      {
        amount: thirdPartyTransferCents,
        currency: "brl",
        destination: thirdPartyDestination,
        transfer_group:
          params.payment.transfer_group ??
          `partner_membership_${params.payment.user_id}_${Date.now()}`,
        source_transaction: params.charge.id,
        metadata: {
          payment_id: params.payment.id,
          recipient_type: "third_party",
        },
      },
      {
        idempotencyKey: `payment:${params.payment.id}:third-party-transfer:v1`,
      },
    );

    thirdPartyTransferId = transfer.id;
  }

  if (!associationTransferId) {
    const transfer = await stripe.transfers.create(
      {
        amount: associationTransferCents,
        currency: "brl",
        destination: associationDestination,
        transfer_group:
          params.payment.transfer_group ??
          `partner_membership_${params.payment.user_id}_${Date.now()}`,
        source_transaction: params.charge.id,
        metadata: {
          payment_id: params.payment.id,
          recipient_type: "association",
        },
      },
      {
        idempotencyKey: `payment:${params.payment.id}:association-transfer:v1`,
      },
    );

    associationTransferId = transfer.id;
  }

  const paymentMethodType = determinePaymentMethodType(params.charge);

  const updatedPayment = await updatePaymentById(params.payment.id, {
    amount_total: gross,
    amount_platform_fee: platformRetainedCents,
    amount_platform_transfer: platformTransferCents,
    amount_third_party_transfer: thirdPartyTransferCents,
    amount_association_transfer: associationTransferCents,
    amount_stripe_fee: fee,
    payment_method_type: paymentMethodType,
    stripe_charge_id: params.charge.id,
    stripe_payment_intent_id: params.paymentIntentId,
    stripe_balance_transaction_id: balanceTx.id,
    stripe_invoice_id: params.invoiceId ?? params.payment.stripe_invoice_id,
    stripe_subscription_id:
      params.subscriptionId ?? params.payment.stripe_subscription_id,
    stripe_event_id: params.eventId,
    paid_at: params.paidAt,
    period_start: params.periodStart,
    period_end: params.periodEnd,
    reference_month: buildReferenceMonth(params.periodStart, params.paidAt),
    status: "succeeded",
    stripe_platform_transfer_id: platformTransferId,
    stripe_third_party_transfer_id: thirdPartyTransferId,
    stripe_association_transfer_id: associationTransferId,
    platform_transfer_destination_account_id: platformDestination,
    third_party_transfer_destination_account_id: thirdPartyDestination,
    association_transfer_destination_account_id: associationDestination,
    gateway_response: {
      ...(params.payment.gateway_response ?? {}),
      last_processed_event_id: params.eventId,
      charge_id: params.charge.id,
      balance_transaction_id: balanceTx.id,
      payment_method_type: paymentMethodType,
      snapshot_platform_retained_cents: platformRetainedCents,
      snapshot_platform_transfer_cents: platformTransferCents,
      snapshot_third_party_transfer_cents: thirdPartyTransferCents,
    },
  });

  log("payment:reconciled", {
    paymentId: updatedPayment.id,
    status: updatedPayment.status,
    chargeId: updatedPayment.stripe_charge_id,
    invoiceId: updatedPayment.stripe_invoice_id,
    subscriptionId: updatedPayment.stripe_subscription_id,
    paymentMethodType: updatedPayment.payment_method_type,
    platformTransferId,
    thirdPartyTransferId,
    associationTransferId,
    platformRetainedCents,
    platformTransferCents,
    thirdPartyTransferCents,
    associationTransferCents,
  });

  return updatedPayment;
}

async function processSuccessfulPayment(params: {
  payment: PaymentRow;
  paymentIntentId: string;
  charge: Stripe.Charge;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  eventId: string;
}) {
  const updatedPayment = await ensureTransfersAndPersist({
    payment: params.payment,
    paymentIntentId: params.paymentIntentId,
    charge: params.charge,
    invoiceId: params.invoiceId,
    subscriptionId: params.subscriptionId,
    paidAt: params.paidAt,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    eventId: params.eventId,
  });

  await syncPartnerEntitlement({
    payment: updatedPayment,
    paidAt: params.paidAt,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  });
}

serve(async (req) => {
  try {
    const signature = req.headers.get("Stripe-Signature");

    if (!signature) {
      return json(400, {
        error: "Assinatura ausente.",
      });
    }

    const body = await req.text();

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );

    log("event:received", {
      id: event.id,
      type: event.type,
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const payment = await getPaymentByCheckoutSession(session.id);

      if (!payment) {
        log("checkout.session.completed:payment-not-found", {
          sessionId: session.id,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const updatedPayment = await updatePaymentById(payment.id, {
        stripe_checkout_session_id: session.id,
        stripe_invoice_id:
          typeof session.invoice === "string"
            ? session.invoice
            : payment.stripe_invoice_id,
        stripe_subscription_id:
          typeof session.subscription === "string"
            ? session.subscription
            : payment.stripe_subscription_id,
        stripe_customer_id:
          typeof session.customer === "string"
            ? session.customer
            : payment.stripe_customer_id,
        status: session.payment_status === "paid" ? "processing" : "pending",
        stripe_event_id: event.id,
        gateway_response: {
          ...(payment.gateway_response ?? {}),
          checkout_session_completed_payment_status: session.payment_status,
          checkout_session_completed_status: session.status,
        },
      });

      log("checkout.session.completed:updated", {
        paymentId: updatedPayment.id,
        sessionId: session.id,
        status: updatedPayment.status,
        invoiceId: updatedPayment.stripe_invoice_id,
        subscriptionId: updatedPayment.stripe_subscription_id,
      });

      if (session.mode === "payment" && session.payment_status === "paid") {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null;

        if (!paymentIntentId) {
          log("checkout.session.completed:missing-payment-intent", {
            paymentId: updatedPayment.id,
            sessionId: session.id,
          });

          return json(200, {
            received: true,
            skipped: true,
          });
        }

        const charge = await resolveChargeFromPaymentIntent(paymentIntentId);

        const paidAt = nowIso();
        const periodStart = paidAt;
        const periodEnd = addMonthIso(periodStart);

        await processSuccessfulPayment({
          payment: updatedPayment,
          paymentIntentId,
          charge,
          paidAt,
          periodStart,
          periodEnd,
          eventId: event.id,
        });
      }
    }

    if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;

      const payment = await getPaymentByCheckoutSession(session.id);

      if (!payment) {
        log("checkout.session.async_payment_succeeded:payment-not-found", {
          sessionId: session.id,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null;

      if (!paymentIntentId) {
        log("checkout.session.async_payment_succeeded:missing-payment-intent", {
          paymentId: payment.id,
          sessionId: session.id,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const charge = await resolveChargeFromPaymentIntent(paymentIntentId);

      const paidAt = nowIso();
      const periodStart = paidAt;
      const periodEnd = addMonthIso(periodStart);

      await processSuccessfulPayment({
        payment,
        paymentIntentId,
        charge,
        paidAt,
        periodStart,
        periodEnd,
        eventId: event.id,
      });
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const payment = await getPaymentByCheckoutSession(session.id);

      if (!payment) {
        log("checkout.session.async_payment_failed:payment-not-found", {
          sessionId: session.id,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      await updatePaymentById(payment.id, {
        status: "failed",
        stripe_event_id: event.id,
      });

      log("payment:failed", {
        reason: "checkout.session.async_payment_failed",
        paymentId: payment.id,
        sessionId: session.id,
      });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;

      const payment = await getPaymentByCheckoutSession(session.id);

      if (!payment) {
        log("checkout.session.expired:payment-not-found", {
          sessionId: session.id,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      await updatePaymentById(payment.id, {
        status: "cancelled",
        stripe_event_id: event.id,
      });

      log("payment:cancelled", {
        reason: "checkout.session.expired",
        paymentId: payment.id,
        sessionId: session.id,
      });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;

      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;

      if (!subscriptionId) {
        log("invoice.paid:missing-subscription", {
          eventId: event.id,
          invoiceId: invoice.id,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      log("invoice.paid:start", {
        eventId: event.id,
        invoiceId: invoice.id,
        subscriptionId,
      });

      const payment = await getOrCreatePaymentForInvoice(
        subscriptionId,
        invoice,
      );

      if (!payment) {
        log("invoice.paid:no-payment-context", {
          eventId: event.id,
          invoiceId: invoice.id,
          subscriptionId,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const paymentIntentId = await resolvePaymentIntentIdFromInvoice(invoice);

      if (!paymentIntentId) {
        log("invoice.paid:missing-payment-intent", {
          eventId: event.id,
          invoiceId: invoice.id,
          subscriptionId,
          paymentId: payment.id,
        });

        await updatePaymentById(payment.id, {
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: subscriptionId,
          stripe_event_id: event.id,
          status: "processing",
          gateway_response: {
            ...(payment.gateway_response ?? {}),
            invoice_paid_missing_payment_intent: true,
            invoice_paid_event_id: event.id,
          },
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const charge = await resolveChargeFromPaymentIntent(paymentIntentId);

      const paidAt = invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : nowIso();

      const periodStart = invoice.lines?.data?.[0]?.period?.start
        ? new Date(invoice.lines.data[0].period.start * 1000).toISOString()
        : invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : paidAt;

      const periodEnd = invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : addMonthIso(periodStart);

      log("invoice.paid:process-successful-payment", {
        eventId: event.id,
        invoiceId: invoice.id,
        paymentId: payment.id,
        paymentIntentId,
        chargeId: charge.id,
        periodStart,
        periodEnd,
      });

      await processSuccessfulPayment({
        payment,
        paymentIntentId,
        charge,
        invoiceId: invoice.id,
        subscriptionId,
        paidAt,
        periodStart,
        periodEnd,
        eventId: event.id,
      });
    }

    if (event.type === "invoice_payment.paid") {
      const invoicePayment = event.data.object as Stripe.InvoicePayment;

      const resolved = await resolveInvoiceFromInvoicePayment(invoicePayment);

      if (!resolved) {
        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const { invoice, paymentIntentId } = resolved;

      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;

      if (!subscriptionId || !paymentIntentId) {
        log("invoice_payment.paid:missing-context", {
          eventId: event.id,
          invoicePaymentId: invoicePayment.id,
          invoiceId: invoice.id,
          subscriptionId,
          paymentIntentId,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const payment = await getOrCreatePaymentForInvoice(
        subscriptionId,
        invoice,
      );

      if (!payment) {
        log("invoice_payment.paid:no-payment-context", {
          eventId: event.id,
          invoicePaymentId: invoicePayment.id,
          invoiceId: invoice.id,
          subscriptionId,
        });

        return json(200, {
          received: true,
          skipped: true,
        });
      }

      const charge = await resolveChargeFromPaymentIntent(paymentIntentId);

      const paidAt = invoicePayment.status_transitions?.paid_at
        ? new Date(
            invoicePayment.status_transitions.paid_at * 1000,
          ).toISOString()
        : invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : nowIso();

      const periodStart = invoice.lines?.data?.[0]?.period?.start
        ? new Date(invoice.lines.data[0].period.start * 1000).toISOString()
        : invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : paidAt;

      const periodEnd = invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : addMonthIso(periodStart);

      log("invoice_payment.paid:process-successful-payment", {
        eventId: event.id,
        invoicePaymentId: invoicePayment.id,
        invoiceId: invoice.id,
        paymentId: payment.id,
        paymentIntentId,
        chargeId: charge.id,
        periodStart,
        periodEnd,
      });

      await processSuccessfulPayment({
        payment,
        paymentIntentId,
        charge,
        invoiceId: invoice.id,
        subscriptionId,
        paidAt,
        periodStart,
        periodEnd,
        eventId: event.id,
      });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;

      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;

      let payment = invoice.id ? await getPaymentByInvoice(invoice.id) : null;

      if (!payment) {
        const paymentIntentId =
          await resolvePaymentIntentIdFromInvoice(invoice);

        if (paymentIntentId) {
          payment = await getPaymentByPaymentIntent(paymentIntentId);
        }
      }

      if (!payment && subscriptionId) {
        payment = await getLatestPaymentBySubscription(subscriptionId);
      }

      if (payment) {
        await updatePaymentById(payment.id, {
          status: "failed",
          stripe_invoice_id: invoice.id,
          stripe_subscription_id:
            subscriptionId ?? payment.stripe_subscription_id,
          stripe_event_id: event.id,
        });

        log("payment:failed", {
          reason: "invoice.payment_failed",
          paymentId: payment.id,
          invoiceId: invoice.id,
          subscriptionId,
        });
      } else {
        log("invoice.payment_failed:payment-not-found", {
          invoiceId: invoice.id,
          subscriptionId,
        });
      }

      if (subscriptionId) {
        await markLatestPartnerPastDueBySubscription(subscriptionId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const subscriptionId = subscription.id;

      await admin
        .from("payments")
        .update({
          status: "cancelled",
          stripe_event_id: event.id,
          updated_at: nowIso(),
        })
        .eq("stripe_subscription_id", subscriptionId)
        .in("status", ["pending", "processing", "requires_action"]);

      await cancelPartnersBySubscription(subscriptionId);

      log("subscription:deleted", {
        subscriptionId,
      });
    }

    return json(200, {
      received: true,
    });
  } catch (error) {
    log("fatal", {
      message: error instanceof Error ? error.message : "Webhook inválido.",
    });

    return json(400, {
      error: error instanceof Error ? error.message : "Webhook inválido.",
    });
  }
});
