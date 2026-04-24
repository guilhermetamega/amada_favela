import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";
import {
  addMinutesIso,
  createPixPayment,
  getMercadoPagoConfig,
  normalizeInternalPaymentStatus,
  refreshAuthorization,
  sanitizeCpf,
  splitFullName,
  toMoneyNumberFromCents,
} from "../_shared/mercadopago.ts";

const LOG_PREFIX = "[mercadopago-create-membership-pix]";

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function toCents(value: number | string | null | undefined) {
  const normalized =
    typeof value === "number"
      ? value
      : Number(
          String(value ?? "")
            .replace(",", ".")
            .trim(),
        );

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("Mensalidade inválida.");
  }

  return Math.round(normalized * 100);
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

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json(401, { error: "Authorization header ausente." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json(500, { error: "Secrets do Supabase não configurados." });
    }

    const mp = getMercadoPagoConfig();

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: { persistSession: false },
    });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      return json(401, { error: "Sessão inválida." });
    }

    const { data: user, error: userError } = await admin
      .from("users")
      .select("id, fullname, email, cpf, comunity")
      .eq("id", authUser.id)
      .single();

    if (userError || !user) {
      return json(404, { error: "Usuário não encontrado." });
    }

    if (!user.email) {
      return json(400, { error: "Usuário sem e-mail cadastrado." });
    }

    const cpf = sanitizeCpf(user.cpf);

    if (cpf.length !== 11) {
      return json(400, {
        error: "Usuário precisa ter CPF válido cadastrado para pagar com Pix.",
      });
    }

    const { data: association, error: associationError } = await admin
      .from("association")
      .select("id, name, community, monthly_fee, is_active")
      .eq("community", user.comunity)
      .eq("is_active", true)
      .single();

    if (associationError || !association) {
      return json(404, { error: "Associação ativa não encontrada." });
    }

    const { data: existingPending, error: existingPendingError } = await admin
      .from("payments")
      .select(
        "id, provider_payment_id, status, gateway_response, expires_at, checkout_url",
      )
      .eq("provider", "mercadopago")
      .eq("payment_method_type", "pix")
      .eq("purpose", "partner_membership")
      .eq("user_id", user.id)
      .eq("association_id", association.id)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPendingError) {
      return json(500, {
        error: `Erro ao verificar Pix pendente: ${existingPendingError.message}`,
      });
    }

    if (existingPending) {
      const transactionData = getPixTransactionData(
        existingPending.gateway_response ?? {},
      );

      return json(200, {
        existing: true,
        paymentId: existingPending.provider_payment_id,
        internalPaymentId: existingPending.id,
        qrCode: transactionData.qrCode,
        qrCodeBase64: transactionData.qrCodeBase64,
        ticketUrl: transactionData.ticketUrl ?? existingPending.checkout_url,
        expiresAt: existingPending.expires_at,
        status: existingPending.status,
      });
    }

    const { data: sellerData, error: sellerError } = await admin
      .from("mercadopago_seller_accounts")
      .select("*")
      .eq("association_id", association.id)
      .eq("status", "active")
      .single();

    if (sellerError || !sellerData) {
      return json(400, {
        error: "A associação ainda não conectou a conta Mercado Pago.",
      });
    }

    const seller = await refreshSellerIfNeeded({
      admin,
      seller: sellerData as Record<string, unknown>,
    });

    const amountTotalCents = toCents(association.monthly_fee);

    if (amountTotalCents <= mp.applicationFeeCents) {
      return json(400, {
        error: "Mensalidade insuficiente para a taxa fixa da plataforma.",
      });
    }

    const externalReference = `mp_membership_${crypto.randomUUID()}`;
    const expiresAt = addMinutesIso(mp.pixExpirationMinutes);
    const { firstName, lastName } = splitFullName(user.fullname);

    const { data: insertedPayment, error: insertError } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        association_id: association.id,
        provider: "mercadopago",
        purpose: "partner_membership",
        payment_method_type: "pix",
        status: "pending",
        currency: "brl",
        amount_total: amountTotalCents,
        amount_platform_fee: mp.applicationFeeCents,
        amount_platform_transfer: 0,
        amount_third_party_transfer: 0,
        amount_association_transfer: amountTotalCents - mp.applicationFeeCents,
        amount_stripe_fee: 0,
        description: `Mensalidade - ${association.name}`,
        external_reference: externalReference,
        community: association.community,
        checkout_mode: "payment",
        metadata: {
          source: "mercadopago-create-membership-pix",
          association_id: association.id,
          mp_seller_user_id: seller.mp_user_id,
        },
        gateway_response: {},
        created_by: user.id,
        updated_by: user.id,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !insertedPayment) {
      return json(500, {
        error: `Falha ao registrar pagamento local: ${insertError?.message}`,
      });
    }

    try {
      const payment = await createPixPayment({
        sellerAccessToken: String(seller.access_token),
        idempotencyKey: crypto.randomUUID(),
        body: {
          description: `Mensalidade - ${association.name}`,
          transaction_amount: toMoneyNumberFromCents(amountTotalCents),
          payment_method_id: "pix",
          application_fee: toMoneyNumberFromCents(mp.applicationFeeCents),
          date_of_expiration: expiresAt,
          external_reference: externalReference,
          notification_url: mp.webhookUrl,
          payer: {
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            identification: {
              type: "CPF",
              number: cpf,
            },
          },
        },
      });

      const internalStatus = normalizeInternalPaymentStatus(payment.status);
      const transactionData = getPixTransactionData(payment);

      const { error: updateError } = await admin
        .from("payments")
        .update({
          provider_payment_id: String(payment.id),
          provider_status: payment.status,
          provider_status_detail: payment.status_detail ?? null,
          status: internalStatus,
          checkout_url: transactionData.ticketUrl,
          expires_at: payment.date_of_expiration ?? expiresAt,
          gateway_response: payment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", insertedPayment.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      log("pix-created", {
        internalPaymentId: insertedPayment.id,
        mpPaymentId: payment.id,
        associationId: association.id,
        hasQrCode: Boolean(transactionData.qrCode),
        hasQrCodeBase64: Boolean(transactionData.qrCodeBase64),
      });

      return json(200, {
        existing: false,
        internalPaymentId: insertedPayment.id,
        paymentId: String(payment.id),
        status: internalStatus,
        providerStatus: payment.status,
        providerStatusDetail: payment.status_detail ?? null,
        expiresAt: payment.date_of_expiration ?? expiresAt,
        qrCode: transactionData.qrCode,
        qrCodeBase64: transactionData.qrCodeBase64,
        ticketUrl: transactionData.ticketUrl,
      });
    } catch (error) {
      await admin
        .from("payments")
        .update({
          status: "failed",
          provider_status: "error",
          provider_status_detail:
            error instanceof Error ? error.message : "Falha na criação do Pix",
          updated_at: new Date().toISOString(),
        })
        .eq("id", insertedPayment.id);

      throw error;
    }
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error ? error.message : "Erro interno ao criar Pix.",
    });
  }
});
