import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";
import {
  fetchPayment,
  getMercadoPagoConfig,
  normalizeInternalPaymentStatus,
  refreshAuthorization,
  verifyWebhookSignature,
} from "../_shared/mercadopago.ts";

const LOG_PREFIX = "[mercadopago-webhook]";

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function addMonthIso(baseIso: string) {
  const date = new Date(baseIso);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function getPixTransactionData(source: unknown) {
  const root =
    typeof source === "object" && source !== null
      ? (source as Record<string, unknown>)
      : null;

  const pointOfInteraction =
    root?.point_of_interaction && typeof root.point_of_interaction === "object"
      ? (root.point_of_interaction as Record<string, unknown>)
      : null;

  const transactionData =
    pointOfInteraction?.transaction_data &&
    typeof pointOfInteraction.transaction_data === "object"
      ? (pointOfInteraction.transaction_data as Record<string, unknown>)
      : null;

  return {
    qrCode:
      typeof transactionData?.qr_code === "string"
        ? transactionData.qr_code
        : null,
    qrCodeBase64:
      typeof transactionData?.qr_code_base64 === "string"
        ? transactionData.qr_code_base64
        : null,
    ticketUrl:
      typeof transactionData?.ticket_url === "string"
        ? transactionData.ticket_url
        : null,
  };
}

function getGatewayFeeCents(source: unknown) {
  const root =
    typeof source === "object" && source !== null
      ? (source as Record<string, unknown>)
      : null;

  const feeDetails = Array.isArray(root?.fee_details)
    ? (root?.fee_details as Array<Record<string, unknown>>)
    : [];

  const total = feeDetails.reduce((sum, item) => {
    const amount = Number(item.amount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  return Math.round(total * 100);
}

function safeJsonParse(value: string) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

async function refreshSellerIfNeeded(params: {
  admin: ReturnType<typeof createClient>;
  seller: Record<string, unknown>;
}) {
  const mp = getMercadoPagoConfig();
  const tokenExpiresAt = new Date(
    String(params.seller.token_expires_at),
  ).getTime();
  const refreshWindowMs = 30 * 24 * 60 * 60 * 1000;

  if (tokenExpiresAt > Date.now() + refreshWindowMs) {
    return params.seller;
  }

  const refreshed = await refreshAuthorization({
    clientId: mp.clientId,
    clientSecret: mp.clientSecret,
    refreshToken: String(params.seller.refresh_token),
  });

  const tokenExpiresAtIso = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString();

  const { data, error } = await params.admin
    .from("mercadopago_seller_accounts")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      public_key: refreshed.public_key,
      token_type: refreshed.token_type,
      scope: refreshed.scope,
      live_mode: refreshed.live_mode,
      expires_in: refreshed.expires_in,
      token_expires_at: tokenExpiresAtIso,
      last_refreshed_at: new Date().toISOString(),
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.seller.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Falha ao atualizar seller account.");
  }

  return data as Record<string, unknown>;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Secrets do Supabase não configurados." });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const mp = getMercadoPagoConfig();

  try {
    const rawBody = await req.text();
    const body = safeJsonParse(rawBody);
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());

    const topic = String(
      body?.type ??
        body?.topic ??
        url.searchParams.get("type") ??
        url.searchParams.get("topic") ??
        "",
    );

    const dataId = String(
      body?.data?.id ??
        body?.id ??
        url.searchParams.get("data.id") ??
        url.searchParams.get("id") ??
        "",
    );

    const action = String(body?.action ?? "");
    const hasSignature =
      Boolean(req.headers.get("x-signature")) &&
      Boolean(req.headers.get("x-request-id"));

    const isSignatureValid = hasSignature
      ? await verifyWebhookSignature(req, mp.webhookSecret)
      : null;

    await admin.from("mercadopago_webhook_events").insert({
      topic: topic || null,
      action: action || null,
      data_id: dataId || null,
      live_mode: Boolean(body?.live_mode ?? false),
      type: topic || null,
      is_signature_valid: isSignatureValid,
      raw_payload: body,
      query_params: query,
      headers: {
        "x-signature": req.headers.get("x-signature"),
        "x-request-id": req.headers.get("x-request-id"),
        "user-agent": req.headers.get("user-agent"),
      },
    });

    if (hasSignature && !isSignatureValid) {
      return json(401, { error: "Assinatura inválida." });
    }

    if (!dataId) {
      return json(200, {
        received: true,
        skipped: true,
        reason: "missing-data-id",
      });
    }

    if (topic !== "payment") {
      return json(200, {
        received: true,
        skipped: true,
        reason: "unsupported-topic",
      });
    }

    const { data: paymentRow, error: paymentError } = await admin
      .from("payments")
      .select(
        `
          id,
          user_id,
          association_id,
          provider_payment_id,
          provider_status,
          provider_status_detail,
          status,
          amount_total,
          amount_platform_fee,
          amount_association_transfer,
          amount_stripe_fee,
          gateway_response,
          paid_at
        `,
      )
      .eq("provider", "mercadopago")
      .eq("provider_payment_id", dataId)
      .maybeSingle();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    if (!paymentRow) {
      return json(200, {
        received: true,
        skipped: true,
        reason: "payment-not-found",
      });
    }

    const { data: sellerData, error: sellerError } = await admin
      .from("mercadopago_seller_accounts")
      .select("*")
      .eq("association_id", paymentRow.association_id)
      .eq("status", "active")
      .single();

    if (sellerError || !sellerData) {
      throw new Error("Seller account não encontrada ao processar webhook.");
    }

    const seller = await refreshSellerIfNeeded({
      admin,
      seller: sellerData as Record<string, unknown>,
    });

    const mpPayment = await fetchPayment({
      sellerAccessToken: String(seller.access_token),
      paymentId: dataId,
    });

    const internalStatus = normalizeInternalPaymentStatus(mpPayment.status);
    const transactionData = getPixTransactionData(mpPayment);
    const gatewayFeeCents = getGatewayFeeCents(mpPayment);
    const amountAssociationTransfer = Math.max(
      0,
      Number(paymentRow.amount_total) -
        Number(paymentRow.amount_platform_fee) -
        gatewayFeeCents,
    );
    const now = new Date().toISOString();
    const paidAt =
      mpPayment.status === "approved"
        ? (paymentRow.paid_at ?? now)
        : (paymentRow.paid_at ?? null);

    const { error: updatePaymentError } = await admin
      .from("payments")
      .update({
        status: internalStatus,
        provider_status: mpPayment.status,
        provider_status_detail: mpPayment.status_detail ?? null,
        amount_stripe_fee: gatewayFeeCents,
        amount_association_transfer: amountAssociationTransfer,
        paid_at: paidAt,
        expires_at: mpPayment.date_of_expiration ?? null,
        checkout_url: transactionData.ticketUrl,
        gateway_response: mpPayment,
        updated_at: now,
      })
      .eq("id", paymentRow.id);

    if (updatePaymentError) {
      throw new Error(updatePaymentError.message);
    }

    if (mpPayment.status === "approved") {
      const expiresAt = addMonthIso(now);

      const { data: existingPartner, error: partnerSelectError } = await admin
        .from("partners")
        .select("id")
        .eq("payment_id", paymentRow.id)
        .maybeSingle();

      if (partnerSelectError) {
        throw new Error(partnerSelectError.message);
      }

      const partnerPayload = {
        user_id: paymentRow.user_id,
        association_id: paymentRow.association_id,
        payment_id: paymentRow.id,
        payment_status: "paid",
        created_at: now,
        expires_at: expiresAt,
        status: "active",
      };

      if (existingPartner?.id) {
        const { error } = await admin
          .from("partners")
          .update(partnerPayload)
          .eq("id", existingPartner.id);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await admin.from("partners").insert(partnerPayload);

        if (error) {
          throw new Error(error.message);
        }
      }
    }

    log("payment-synced", {
      internalPaymentId: paymentRow.id,
      mpPaymentId: dataId,
      status: mpPayment.status,
      hasSignature,
      isSignatureValid,
    });

    return json(200, { received: true });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno no webhook Mercado Pago.",
    });
  }
});
