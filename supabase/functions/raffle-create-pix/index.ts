import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, json } from "../_shared/http.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const {
      raffleId,
      selectedNumbers,
      buyerName,
      buyerPhone,
      buyerInstagram,
      buyerEmail,
    } = await req.json();

    if (
      !raffleId ||
      !Array.isArray(selectedNumbers) ||
      selectedNumbers.length === 0 ||
      !buyerName ||
      !buyerPhone
    ) {
      return json(400, { error: "Dados inválidos para pagamento." });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: raffle, error: raffleError } = await admin
      .from("sponsor_raffles")
      .select("id,title,number_price_cents,sales_end_at,status")
      .eq("id", raffleId)
      .single();
    if (raffleError || !raffle)
      return json(404, { error: "Rifa não encontrada." });
    if (
      raffle.status !== "active" ||
      new Date(raffle.sales_end_at).getTime() < Date.now()
    )
      return json(400, { error: "Rifa encerrada." });

    const totalCents = selectedNumbers.length * raffle.number_price_cents;
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}`,
      },
      body: JSON.stringify({
        transaction_amount: Number((totalCents / 100).toFixed(2)),
        description: `Rifa ${raffle.title}`,
        payment_method_id: "pix",
        payer: {
          email:
            (buyerEmail && buyerEmail.trim()) ||
            `comprador+${crypto.randomUUID()}@example.com`,
          first_name: buyerName,
        },
        metadata: {
          raffle_id: raffleId,
          selected_numbers: selectedNumbers,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          buyer_instagram: buyerInstagram || null,
          buyer_email: buyerEmail || null,
        },
      }),
    });

    const mpData = await mpResponse.json();
    if (!mpResponse.ok) {
      const cause = typeof mpData?.message === "string" ? mpData.message : "";
      return json(400, {
        error: `Falha ao criar pagamento PIX.${cause ? ` ${cause}` : ""}`,
        details: mpData,
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
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno.",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
