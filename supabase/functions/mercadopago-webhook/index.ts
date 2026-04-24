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

function safeJsonParse(value: string) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
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
    ? (root.fee_details as Array<Record<string, unknown>>)
    : [];

  const total = feeDetails.reduce((sum, item) => {
    const amount = Number(item.amount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  return Math.round(total * 100);
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

    const hasSignature =
      Boolean(req.headers.get("x-signature")) &&
      Boolean(req.headers.get("x-request-id"));

    const type = String(
      body?.type ?? body?.topic ?? url.searchParams.get("type") ?? "",
    );

    const action = String(body?.action ?? "");

    const dataId = String(
      body?.data?.id ?? url.searchParams.get("data.id") ?? "",
    );

    log("webhook-start", {
      type,
      action,
      dataId,
      hasSignature,
      userAgent: req.headers.get("user-agent"),
    });

    // IPN removido do fluxo: requests sem assinatura são ignorados.
    if (!hasSignature) {
      log("unsigned-request-ignored", {
        query,
        userAgent: req.headers.get("user-agent"),
      });

      return json(200, {
        received: true,
        skipped: true,
        reason: "unsigned-request-ignored",
      });
    }

    const isSignatureValid = await verifyWebhookSignature(
      req,
      mp.webhookSecret,
    );

    try {
      await admin.from("mercadopago_webhook_events").insert({
        topic: type || null,
        action: action || null,
        data_id: dataId || null,
        live_mode: Boolean(body?.live_mode ?? false),
        type: type || null,
        is_signature_valid: isSignatureValid,
        raw_payload: body,
        query_params: query,
        headers: {
          "x-signature": req.headers.get("x-signature"),
          "x-request-id": req.headers.get("x-request-id"),
          "user-agent": req.headers.get("user-agent"),
        },
      });
    } catch (logError) {
      log("webhook-event-log-failed", logError);
    }

    if (!isSignatureValid) {
      return json(401, { error: "Assinatura inválida." });
    }

    if (!dataId) {
      return json(200, {
        received: true,
        skipped: true,
        reason: "missing-data-id",
      });
    }

    if (type !== "payment") {
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
          provider,
          provider_payment_id,
          status,
          provider_status,
          provider_status_detail,
          amount_total,
          amount_platform_fee,
          amount_association_transfer,
          amount_stripe_fee,
          gateway_response,
          paid_at,
          expires_at
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
    const gatewayFeeCents = getGatewayFeeCents(mpPayment);
    const transactionData = getPixTransactionData(mpPayment);
    const now = new Date().toISOString();

    const amountAssociationTransfer = Math.max(
      0,
      Number(paymentRow.amount_total) -
        Number(paymentRow.amount_platform_fee) -
        gatewayFeeCents,
    );

    log("payment-fetched", {
      paymentId: paymentRow.id,
      providerPaymentId: dataId,
      remoteStatus: mpPayment.status,
      remoteStatusDetail: mpPayment.status_detail,
      internalStatus,
      gatewayFeeCents,
      amountAssociationTransfer,
    });

    // Evita rebaixar localmente um pagamento já liquidado.
    const alreadySucceeded =
      paymentRow.status === "succeeded" || Boolean(paymentRow.paid_at);

    if (alreadySucceeded && mpPayment.status !== "approved") {
      log("skip-status-downgrade", {
        paymentId: paymentRow.id,
        providerPaymentId: dataId,
        currentStatus: paymentRow.status,
        currentProviderStatus: paymentRow.provider_status,
        remoteStatus: mpPayment.status,
        remoteStatusDetail: mpPayment.status_detail,
      });

      return json(200, {
        received: true,
        skipped: true,
        reason: "already-succeeded-no-downgrade",
      });
    }

    const paidAt =
      mpPayment.status === "approved"
        ? (paymentRow.paid_at ?? now)
        : (paymentRow.paid_at ?? null);

    log("before-payment-update", {
      paymentId: paymentRow.id,
      currentStatus: paymentRow.status,
      newStatus: internalStatus,
      paidAt,
    });

    const { error: updatePaymentError } = await admin
      .from("payments")
      .update({
        status: internalStatus,
        provider_status: mpPayment.status,
        provider_status_detail: mpPayment.status_detail ?? null,
        amount_stripe_fee: gatewayFeeCents,
        amount_platform_transfer: 0,
        amount_third_party_transfer: 0,
        amount_association_transfer: amountAssociationTransfer,
        paid_at: paidAt,
        expires_at:
          mpPayment.date_of_expiration ?? paymentRow.expires_at ?? null,
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

      log("before-partner-upsert", {
        userId: paymentRow.user_id,
        associationId: paymentRow.association_id,
        paymentId: paymentRow.id,
        expiresAt,
      });

      const { data: existingPartner, error: partnerSelectError } = await admin
        .from("partners")
        .select("id")
        .eq("user_id", paymentRow.user_id)
        .eq("association_id", paymentRow.association_id)
        .maybeSingle();

      if (partnerSelectError) {
        throw new Error(partnerSelectError.message);
      }

      const partnerPayload = {
        user_id: paymentRow.user_id,
        association_id: paymentRow.association_id,
        payment_id: paymentRow.id,
        payment_status: "paid",
        expires_at: expiresAt,
        status: "active",
      };

      if (existingPartner?.id) {
        const { error } = await admin
          .from("partners")
          .update({
            payment_id: partnerPayload.payment_id,
            payment_status: partnerPayload.payment_status,
            expires_at: partnerPayload.expires_at,
            status: partnerPayload.status,
          })
          .eq("id", existingPartner.id);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await admin.from("partners").insert({
          ...partnerPayload,
          created_at: now,
        });

        if (error) {
          throw new Error(error.message);
        }
      }
    }

    log("payment-synced", {
      internalPaymentId: paymentRow.id,
      mpPaymentId: dataId,
      status: mpPayment.status,
      statusDetail: mpPayment.status_detail,
    });

    return json(200, { received: true });
  } catch (error) {
    log("fatal", error instanceof Error ? error.message : error);

    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno no webhook Mercado Pago.",
    });
  }
});
