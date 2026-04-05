import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@latest?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const kayoAccountId = Deno.env.get("STRIPE_KAYO_ACCOUNT_ID");

if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  throw new Error("Secrets obrigatórios do webhook não configurados.");
}

const stripe = new Stripe(stripeSecret);

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

type MembershipPaymentRow = {
  id: string;
  user_id: string;
  community: string;
  association_id: string;
  amount_gross_cents: number;
  currency: string;
  transfer_group: string;
  stripe_checkout_session_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  payment_method: string | null;
  checkout_mode: string | null;
  notes: string | null;
  status: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function getAssociationPayoutConfig(associationId: string) {
  const { data, error } = await admin
    .from("association")
    .select(
      "id, stripe_connected_account_id, stripe_third_party_account_id, stripe_third_party_label",
    )
    .eq("id", associationId)
    .single();

  if (
    error ||
    !data?.stripe_connected_account_id ||
    !data?.stripe_third_party_account_id
  ) {
    throw new Error("Configuração de split da associação não encontrada.");
  }

  return data as {
    id: string;
    stripe_connected_account_id: string;
    stripe_third_party_account_id: string;
    stripe_third_party_label: string | null;
  };
}

async function getPaymentByCheckoutSession(sessionId: string) {
  const { data, error } = await admin
    .from("membership_payments")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as MembershipPaymentRow | null;
}

async function getPaymentByInvoice(invoiceId: string) {
  const { data, error } = await admin
    .from("membership_payments")
    .select("*")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as MembershipPaymentRow | null;
}

async function getLatestPaymentBySubscription(subscriptionId: string) {
  const { data, error } = await admin
    .from("membership_payments")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as MembershipPaymentRow | null;
}

async function getOrCreatePaymentForInvoice(
  subscriptionId: string,
  invoice: Stripe.Invoice,
) {
  const existingInvoicePayment = await getPaymentByInvoice(invoice.id);

  if (existingInvoicePayment) {
    return existingInvoicePayment;
  }

  const latestPayment = await getLatestPaymentBySubscription(subscriptionId);

  if (!latestPayment) {
    return null;
  }

  const amountGrossCents =
    typeof invoice.amount_paid === "number" && invoice.amount_paid > 0
      ? invoice.amount_paid
      : latestPayment.amount_gross_cents;

  if (!latestPayment.stripe_invoice_id) {
    const { data, error } = await admin
      .from("membership_payments")
      .update({
        stripe_invoice_id: invoice.id,
        amount_gross_cents: amountGrossCents,
        status: "processing",
      })
      .eq("id", latestPayment.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Falha ao atualizar cobrança inicial.");
    }

    return data as MembershipPaymentRow;
  }

  const newTransferGroup = `membership_${latestPayment.user_id}_${Date.now()}`;

  const insertPayload = {
    user_id: latestPayment.user_id,
    community: latestPayment.community,
    association_id: latestPayment.association_id,
    amount_gross_cents: amountGrossCents,
    currency: latestPayment.currency || "brl",
    stripe_subscription_id: subscriptionId,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: latestPayment.stripe_customer_id,
    payment_method: latestPayment.payment_method ?? "pix",
    checkout_mode: "subscription",
    transfer_group: newTransferGroup,
    platform_retained_cents: 250,
    platform_two_cents: 250,
    third_party_cents: 100,
    notes: latestPayment.notes,
    status: "processing",
  };

  const { data, error } = await admin
    .from("membership_payments")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Falha ao criar cobrança recorrente.");
  }

  return data as MembershipPaymentRow;
}

async function ensureTransfers(params: {
  membershipPaymentId: string;
  associationId: string;
  transferGroup: string;
  chargeId: string;
  paymentIntentId: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  paidAt?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  eventId?: string | null;
}) {
  const existingTransfers = await admin
    .from("membership_payment_transfers")
    .select("id")
    .eq("membership_payment_id", params.membershipPaymentId)
    .limit(1);

  if (existingTransfers.data && existingTransfers.data.length > 0) {
    return;
  }

  if (!kayoAccountId) {
    throw new Error("STRIPE_KAYO_ACCOUNT_ID não configurado.");
  }

  const association = await getAssociationPayoutConfig(params.associationId);

  const charge = await stripe.charges.retrieve(params.chargeId, {
    expand: ["balance_transaction"],
  });

  const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;
  const fee = balanceTx.fee ?? 0;
  const gross = charge.amount;
  const net = gross - fee;

  const kayoCents = 250;
  const thirdPartyCents = 100;
  const platformRetainedCents = 250;
  const associationCents =
    net - kayoCents - thirdPartyCents - platformRetainedCents;

  if (associationCents < 0) {
    throw new Error(
      "Valor líquido insuficiente para executar o split configurado.",
    );
  }

  const sourceTransaction = charge.id;

  const [kayoTransfer, thirdTransfer, associationTransfer] = await Promise.all([
    stripe.transfers.create({
      amount: kayoCents,
      currency: "brl",
      destination: kayoAccountId,
      transfer_group: params.transferGroup,
      source_transaction: sourceTransaction,
      metadata: {
        membership_payment_id: params.membershipPaymentId,
        recipient_type: "kayo",
      },
    }),
    stripe.transfers.create({
      amount: thirdPartyCents,
      currency: "brl",
      destination: association.stripe_third_party_account_id,
      transfer_group: params.transferGroup,
      source_transaction: sourceTransaction,
      metadata: {
        membership_payment_id: params.membershipPaymentId,
        recipient_type: "third_party",
      },
    }),
    stripe.transfers.create({
      amount: associationCents,
      currency: "brl",
      destination: association.stripe_connected_account_id,
      transfer_group: params.transferGroup,
      source_transaction: sourceTransaction,
      metadata: {
        membership_payment_id: params.membershipPaymentId,
        recipient_type: "association",
      },
    }),
  ]);

  await admin.from("membership_payment_transfers").insert([
    {
      membership_payment_id: params.membershipPaymentId,
      recipient_type: "kayo",
      recipient_account_id: kayoAccountId,
      amount_cents: kayoCents,
      stripe_transfer_id: kayoTransfer.id,
    },
    {
      membership_payment_id: params.membershipPaymentId,
      recipient_type: "third_party",
      recipient_account_id: association.stripe_third_party_account_id,
      amount_cents: thirdPartyCents,
      stripe_transfer_id: thirdTransfer.id,
    },
    {
      membership_payment_id: params.membershipPaymentId,
      recipient_type: "association",
      recipient_account_id: association.stripe_connected_account_id,
      amount_cents: associationCents,
      stripe_transfer_id: associationTransfer.id,
    },
  ]);

  await admin
    .from("membership_payments")
    .update({
      stripe_fee_cents: fee,
      amount_net_cents: net,
      platform_one_cents: platformRetainedCents,
      platform_two_cents: kayoCents,
      third_party_cents: thirdPartyCents,
      association_cents: associationCents,
      stripe_charge_id: params.chargeId,
      stripe_payment_intent_id: params.paymentIntentId,
      stripe_balance_transaction_id: balanceTx.id,
      stripe_invoice_id: params.invoiceId ?? null,
      stripe_subscription_id: params.subscriptionId ?? null,
      stripe_event_id: params.eventId ?? null,
      paid_at: params.paidAt,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      status: params.subscriptionId ? "active" : "paid",
    })
    .eq("id", params.membershipPaymentId);

  // TODO opcional:
  // atualizar/upsert da tabela partners com expires_at = params.periodEnd
  // para sincronizar o pagamento confirmado com o status de sócio.
}

serve(async (req) => {
  try {
    const signature = req.headers.get("Stripe-Signature");

    if (!signature) {
      return json(400, { error: "Assinatura ausente." });
    }

    const body = await req.text();

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      await admin
        .from("membership_payments")
        .update({
          stripe_checkout_session_id: session.id,
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          status: session.payment_status === "paid" ? "processing" : "pending",
          stripe_event_id: event.id,
        })
        .eq("stripe_checkout_session_id", session.id);
    }

    if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await getPaymentByCheckoutSession(session.id);

      if (!payment) {
        return json(200, { received: true, skipped: true });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null;

      if (!paymentIntentId) {
        return json(200, { received: true, skipped: true });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        {
          expand: ["latest_charge.balance_transaction"],
        },
      );

      const latestCharge = paymentIntent.latest_charge as Stripe.Charge;

      await ensureTransfers({
        membershipPaymentId: payment.id,
        associationId: payment.association_id,
        transferGroup: payment.transfer_group,
        chargeId: latestCharge.id,
        paymentIntentId,
        paidAt: new Date().toISOString(),
        eventId: event.id,
      });
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;

      await admin
        .from("membership_payments")
        .update({
          status: "failed",
          stripe_event_id: event.id,
        })
        .eq("stripe_checkout_session_id", session.id);
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;

      if (!subscriptionId) {
        return json(200, { received: true, skipped: true });
      }

      const payment = await getOrCreatePaymentForInvoice(
        subscriptionId,
        invoice,
      );

      if (!payment) {
        return json(200, { received: true, skipped: true });
      }

      const paymentIntentId =
        typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : null;

      if (!paymentIntentId) {
        return json(200, { received: true, skipped: true });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        {
          expand: ["latest_charge.balance_transaction"],
        },
      );

      const latestCharge = paymentIntent.latest_charge as Stripe.Charge;

      await ensureTransfers({
        membershipPaymentId: payment.id,
        associationId: payment.association_id,
        transferGroup: payment.transfer_group,
        chargeId: latestCharge.id,
        paymentIntentId,
        invoiceId: invoice.id,
        subscriptionId,
        paidAt: new Date().toISOString(),
        periodStart: invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : null,
        periodEnd: invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null,
        eventId: event.id,
      });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;

      if (subscriptionId) {
        await admin
          .from("membership_payments")
          .update({
            status: "past_due",
            stripe_invoice_id: invoice.id,
            stripe_event_id: event.id,
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    return json(200, { received: true });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : "Webhook inválido.",
    });
  }
});
