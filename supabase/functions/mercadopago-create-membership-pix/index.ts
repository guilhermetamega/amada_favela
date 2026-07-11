import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";
import {
  addMinutesIso,
  createPixPayment,
  fetchPayment,
  getMercadoPagoConfig,
  normalizeInternalPaymentStatus,
  refreshAuthorization,
  sanitizeCpf,
  splitFullName,
  toMoneyNumberFromCents,
} from "../_shared/mercadopago.ts";
import { normalizePlatformFeeCents } from "../_shared/plataform-fee.ts";

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

function isValidCpf(value: string | null | undefined) {
  const cpf = String(value ?? "").replace(/\D/g, "");

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let firstDigit = 11 - (sum % 11);

  if (firstDigit >= 10) {
    firstDigit = 0;
  }

  if (firstDigit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;

  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  let secondDigit = 11 - (sum % 11);

  if (secondDigit >= 10) {
    secondDigit = 0;
  }

  return secondDigit === Number(cpf[10]);
}

function buildMercadoPagoPayer(params: {
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
}) {
  const payer: Record<string, unknown> = {
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
  };

  if (isValidCpf(params.cpf)) {
    payer.identification = {
      type: "CPF",
      number: params.cpf,
    };
  }

  return payer;
}

function buildWebhookOnlyNotificationUrl(baseUrl: string) {
  const url = new URL(baseUrl);

  url.searchParams.set("source_news", "webhooks");

  return url.toString();
}

function isOpenProviderStatus(value: unknown) {
  const status = String(value ?? "").toLowerCase();

  return (
    status === "" ||
    status === "pending" ||
    status === "in_process" ||
    status === "authorized"
  );
}

function isTerminalProviderStatus(value: unknown) {
  const status = String(value ?? "").toLowerCase();

  return (
    status === "approved" ||
    status === "cancelled" ||
    status === "rejected" ||
    status === "refunded" ||
    status === "charged_back"
  );
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

function buildExistingPixResponse(paymentRow: {
  id: string;
  provider_payment_id: string | null;
  status: string;
  provider_status?: string | null;
  provider_status_detail?: string | null;
  expires_at: string | null;
  checkout_url?: string | null;
  gateway_response?: unknown;
}) {
  const transactionData = getPixTransactionData(paymentRow.gateway_response);

  return {
    existing: true,
    paymentId: paymentRow.provider_payment_id,
    internalPaymentId: paymentRow.id,
    qrCode: transactionData.qrCode,
    qrCodeBase64: transactionData.qrCodeBase64,
    ticketUrl: transactionData.ticketUrl ?? paymentRow.checkout_url ?? null,
    expiresAt: paymentRow.expires_at,
    status: paymentRow.status,
    providerStatus: paymentRow.provider_status ?? null,
    providerStatusDetail: paymentRow.provider_status_detail ?? null,
  };
}

serve(async (req) => {
  const cors = handleCors(req);

  if (cors) {
    return cors;
  }

  if (req.method !== "POST") {
    return json(405, {
      error: "Método não permitido.",
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json(401, {
        error: "Authorization header ausente.",
        code: "missing_authorization_header",
        debugStep: "auth-header",
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json(500, {
        error: "Secrets do Supabase não configurados.",
      });
    }

    const mp = getMercadoPagoConfig();

    const webhookOnlyUrl = buildWebhookOnlyNotificationUrl(mp.webhookUrl);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      return json(401, {
        error: "Sessão inválida.",
        code: "invalid_session",
        debugStep: "auth-get-user",
      });
    }

    const { data: user, error: userError } = await admin
      .from("users")
      .select("id, fullname, email, cpf, comunity")
      .eq("id", authUser.id)
      .single();

    if (userError || !user) {
      return json(404, {
        error: "Usuário não encontrado.",
        code: "user_not_found",
        debugStep: "load-user",
      });
    }

    if (!user.email) {
      return json(400, {
        error: "Usuário sem e-mail cadastrado.",
        code: "missing_user_email",
        debugStep: "validate-user-email",
      });
    }

    const cpf = sanitizeCpf(user.cpf);

    if (!isValidCpf(cpf)) {
      log("payer-cpf-not-sent", {
        userId: user.id,
        reason: "invalid-cpf-checksum",
      });
    }

    const { data: association, error: associationError } = await admin
      .from("association")
      .select(
        `
          id,
          name,
          community,
          monthly_fee,
          platform_fee_cents,
          is_active
        `,
      )
      .eq("community", user.comunity)
      .eq("is_active", true)
      .single();

    if (associationError || !association) {
      return json(404, {
        error: "Associação ativa não encontrada.",
        code: "association_not_found",
        debugStep: "load-association",
      });
    }

    let platformFeeCents: number;

    try {
      platformFeeCents = normalizePlatformFeeCents(
        association.platform_fee_cents,
      );
    } catch (error) {
      return json(400, {
        error:
          error instanceof Error
            ? error.message
            : "Taxa da plataforma inválida.",
        code: "invalid_platform_fee",
        debugStep: "validate-platform-fee",
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
        code: "missing_active_seller_account",
        debugStep: "load-seller-account",
      });
    }

    const seller = await refreshSellerIfNeeded({
      admin,
      seller: sellerData as Record<string, unknown>,
    });

    const accessToken = String(seller.access_token ?? "");

    if (!accessToken) {
      return json(400, {
        error: "Access token do seller não encontrado.",
        code: "missing_seller_access_token",
        debugStep: "validate-seller-access-token",
      });
    }

    const { data: latestPayment, error: latestPaymentError } = await admin
      .from("payments")
      .select(
        `
          id,
          provider_payment_id,
          status,
          provider_status,
          provider_status_detail,
          gateway_response,
          expires_at,
          checkout_url,
          created_at
        `,
      )
      .eq("provider", "mercadopago")
      .eq("payment_method_type", "pix")
      .eq("purpose", "partner_membership")
      .eq("user_id", user.id)
      .eq("association_id", association.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (latestPaymentError) {
      return json(500, {
        error: `Erro ao verificar Pix existente: ${latestPaymentError.message}`,
      });
    }

    if (latestPayment) {
      const expiresAtMs = latestPayment.expires_at
        ? new Date(latestPayment.expires_at).getTime()
        : 0;

      const isNotExpired = expiresAtMs > Date.now();

      const cachedResponse = buildExistingPixResponse(latestPayment);

      if (
        isNotExpired &&
        isOpenProviderStatus(latestPayment.provider_status) &&
        (cachedResponse.qrCode ||
          cachedResponse.qrCodeBase64 ||
          cachedResponse.ticketUrl)
      ) {
        log("reusing-cached-pix", {
          internalPaymentId: latestPayment.id,
          providerPaymentId: latestPayment.provider_payment_id,
          providerStatus: latestPayment.provider_status,
        });

        return json(200, cachedResponse);
      }

      if (latestPayment.provider_payment_id && isNotExpired) {
        try {
          const mpPayment = await fetchPayment({
            sellerAccessToken: accessToken,
            paymentId: latestPayment.provider_payment_id,
          });

          const internalStatus = normalizeInternalPaymentStatus(
            mpPayment.status,
          );

          const transactionData = getPixTransactionData(mpPayment);

          const { error: syncError } = await admin
            .from("payments")
            .update({
              status: internalStatus,
              provider_status: mpPayment.status,
              provider_status_detail: mpPayment.status_detail ?? null,
              checkout_url: transactionData.ticketUrl,
              expires_at:
                mpPayment.date_of_expiration ?? latestPayment.expires_at,
              gateway_response: mpPayment,
              updated_at: new Date().toISOString(),
            })
            .eq("id", latestPayment.id);

          if (syncError) {
            throw new Error(syncError.message);
          }

          if (
            isOpenProviderStatus(mpPayment.status) &&
            (transactionData.qrCode ||
              transactionData.qrCodeBase64 ||
              transactionData.ticketUrl)
          ) {
            log("reusing-synced-pix", {
              internalPaymentId: latestPayment.id,
              providerPaymentId: latestPayment.provider_payment_id,
              providerStatus: mpPayment.status,
            });

            return json(200, {
              existing: true,
              paymentId: String(mpPayment.id),
              internalPaymentId: latestPayment.id,
              qrCode: transactionData.qrCode,
              qrCodeBase64: transactionData.qrCodeBase64,
              ticketUrl: transactionData.ticketUrl,
              expiresAt:
                mpPayment.date_of_expiration ?? latestPayment.expires_at,
              status: internalStatus,
              providerStatus: mpPayment.status,
              providerStatusDetail: mpPayment.status_detail ?? null,
            });
          }

          if (isTerminalProviderStatus(mpPayment.status)) {
            log("latest-pix-terminal-status", {
              internalPaymentId: latestPayment.id,
              providerPaymentId: latestPayment.provider_payment_id,
              providerStatus: mpPayment.status,
            });
          }
        } catch (syncRemoteError) {
          log("sync-latest-pix-failed", {
            internalPaymentId: latestPayment.id,
            providerPaymentId: latestPayment.provider_payment_id,
            error:
              syncRemoteError instanceof Error
                ? syncRemoteError.message
                : String(syncRemoteError),
          });

          if (
            isNotExpired &&
            (cachedResponse.qrCode ||
              cachedResponse.qrCodeBase64 ||
              cachedResponse.ticketUrl)
          ) {
            return json(200, cachedResponse);
          }
        }
      }
    }

    const amountTotalCents = toCents(association.monthly_fee);

    if (amountTotalCents <= platformFeeCents) {
      return json(400, {
        error: "Mensalidade insuficiente para a taxa da plataforma.",
        code: "monthly_fee_too_low",
        debugStep: "validate-monthly-fee",
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

        /*
         * No Mercado Pago, a taxa
         * completa é enviada como
         * application_fee.
         */
        amount_platform_fee: platformFeeCents,
        amount_platform_transfer: 0,
        amount_third_party_transfer: 0,

        amount_association_transfer: amountTotalCents - platformFeeCents,
        amount_stripe_fee: 0,
        description: `Mensalidade - ${association.name}`,
        external_reference: externalReference,
        community: association.community,
        checkout_mode: "payment",
        metadata: {
          source: "mercadopago-create-membership-pix",
          association_id: association.id,
          mp_seller_user_id: seller.mp_user_id,
          notification_url: webhookOnlyUrl,
          platform_fee_total_cents: platformFeeCents,
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
        sellerAccessToken: accessToken,
        idempotencyKey: crypto.randomUUID(),
        body: {
          description: `Mensalidade - ${association.name}`,
          transaction_amount: toMoneyNumberFromCents(amountTotalCents),
          payment_method_id: "pix",
          application_fee: toMoneyNumberFromCents(platformFeeCents),
          date_of_expiration: expiresAt,
          external_reference: externalReference,
          notification_url: webhookOnlyUrl,
          payer: buildMercadoPagoPayer({
            email: user.email,
            firstName,
            lastName,
            cpf,
          }),
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
        platformFeeCents,
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
