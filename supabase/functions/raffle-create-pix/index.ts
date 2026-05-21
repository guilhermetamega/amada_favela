import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, json } from "../_shared/http.ts";
import { createPixPayment, toMoneyNumberFromCents } from "../_shared/mercadopago.ts";

const LOG_PREFIX = "[raffle-create-pix]";
function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST")
    return json(405, {
      error: "Método não permitido.",
      debugStep: "method-check",
    });

  const requestId = crypto.randomUUID();

  try {
    log("start", {
      requestId,
      origin: req.headers.get("origin"),
      userAgent: req.headers.get("user-agent"),
    });

    let payload: Record<string, unknown> = {};
    try {
      payload = await req.json();
    } catch {
      return json(400, {
        error: "Body JSON inválido.",
        debugStep: "parse-json",
        requestId,
      });
    }

    const { raffleId, selectedNumbers, buyerName, buyerPhone, buyerInstagram, buyerEmail } = payload;
    const safeEmail =
      typeof buyerEmail === "string" ? buyerEmail.trim().toLowerCase() : "";

    log("payload-received", {
      requestId,
      raffleId,
      selectedCount: Array.isArray(selectedNumbers)
        ? selectedNumbers.length
        : -1,
      hasBuyerName: !!buyerName,
      hasBuyerPhone: !!buyerPhone,
      hasBuyerEmail: !!safeEmail,
    });

    if (
      !raffleId ||
      !Array.isArray(selectedNumbers) ||
      selectedNumbers.length === 0 ||
      !buyerName ||
      !buyerPhone ||
      !safeEmail
    ) {
      return json(400, {
        error:
          "Dados inválidos para pagamento. Nome, telefone e e-mail são obrigatórios.",
        debugStep: "validate-input",
        requestId,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) {
      return json(500, {
        error: "Secrets não configurados (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
        debugStep: "validate-secrets",
        requestId,
      });
    }

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: raffle, error: raffleError } = await admin
      .from("sponsor_raffles")
      .select("id,sponsor_id,title,number_price_cents,sales_end_at,status")
      .eq("id", raffleId)
      .single();

    if (raffleError || !raffle) {
      log("raffle-load-failed", {
        requestId,
        raffleError: raffleError?.message,
      });
      return json(404, {
        error: "Rifa não encontrada.",
        debugStep: "load-raffle",
        requestId,
      });
    }

    if (
      raffle.status !== "active" ||
      new Date(raffle.sales_end_at).getTime() < Date.now()
    ) {
      return json(400, {
        error: "Rifa encerrada.",
        debugStep: "validate-raffle-status",
        requestId,
      });
    }

    const totalCents = selectedNumbers.length * raffle.number_price_cents;
    const { data: seller, error: sellerError } = await admin
      .from("sponsor_mercadopago_accounts")
      .select("access_token,status")
      .eq("sponsor_id", raffle.sponsor_id)
      .eq("status", "active")
      .maybeSingle();

    if (sellerError || !seller?.access_token) {
      return json(400, {
        error: "Patrocinador não conectou a conta Mercado Pago.",
        code: "missing_active_sponsor_seller_account",
        debugStep: "load-sponsor-seller-account",
        requestId,
      });
    }

    const platformFeeCents = Math.floor(totalCents * 0.1);

    log("mercadopago-request", { requestId, totalCents, title: raffle.title, platformFeeCents });

    let mpData: any = {};
    try {
      mpData = await createPixPayment({
        sellerAccessToken: String(seller.access_token),
        idempotencyKey: `raffle-${raffleId}-${safeEmail}-${selectedNumbers.join("-")}`.slice(0, 64),
        body: {
          transaction_amount: toMoneyNumberFromCents(totalCents),
          application_fee: toMoneyNumberFromCents(platformFeeCents),
          description: `Rifa ${raffle.title}`,
          payment_method_id: "pix",
          payer: {
            email: safeEmail,
            first_name: String(buyerName).trim().split(" ")[0] || "Comprador",
          },
          metadata: {
            raffle_id: raffleId,
            selected_numbers: selectedNumbers,
            buyer_name: buyerName,
            buyer_phone: buyerPhone,
            buyer_instagram: buyerInstagram || null,
            buyer_email: safeEmail,
            request_id: requestId,
          },
        },
      });
    } catch (error) {
      return json(400, {
        error: error instanceof Error ? error.message : "Falha ao criar pagamento PIX.",
        debugStep: "mercadopago-create-payment",
        requestId,
      });
    }

    log("mercadopago-response", { requestId, body: mpData });

    if (!mpData?.id) {
      return json(400, {
        error: "Falha ao criar pagamento PIX.",
        details: mpData,
        debugStep: "mercadopago-create-payment",
        requestId,
      });
    }

    return json(200, {
      checkoutCode: String(mpData.id),
      totalCents,
      qrCode: mpData.point_of_interaction?.transaction_data?.qr_code ?? null,
      qrCodeBase64:
        mpData.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      ticketUrl:
        mpData.point_of_interaction?.transaction_data?.ticket_url ?? null,
      debugStep: "done",
      requestId,
    });
  } catch (error) {
    log("unhandled-error", { requestId, error });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno.",
        debugStep: "unhandled-catch",
        requestId,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
