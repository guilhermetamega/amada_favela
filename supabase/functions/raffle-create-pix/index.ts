import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, json } from "../_shared/http.ts";

serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  try {
    const body = await req.json();
    const { raffleId, selectedNumbers, buyerName, buyerPhone, buyerInstagram, buyerEmail } = body as any;
    if (!raffleId || !Array.isArray(selectedNumbers) || selectedNumbers.length === 0) {
      return json({ error: "Dados inválidos." }, { status: 400 });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: raffle, error: raffleError } = await admin.from("sponsor_raffles").select("*").eq("id", raffleId).single();
    if (raffleError || !raffle) return json({ error: "Rifa não encontrada." }, { status: 404 });

    const totalCents = selectedNumbers.length * raffle.number_price_cents;
    const amount = (totalCents / 100).toFixed(2);

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}` },
      body: JSON.stringify({ transaction_amount: Number(amount), description: `Rifa ${raffle.title}`, payment_method_id: "pix", payer: { email: buyerEmail || `raffle-${crypto.randomUUID()}@amada.local`, first_name: buyerName }, metadata: { raffle_id: raffleId, selected_numbers: selectedNumbers, buyer_name: buyerName, buyer_phone: buyerPhone, buyer_instagram: buyerInstagram || null, buyer_email: buyerEmail || null } }),
    });

    const payment = await res.json();
    if (!res.ok) return json({ error: "Falha ao criar PIX", details: payment }, { status: 400 });

    return json({ checkoutCode: payment.id, totalCents, qrCode: payment.point_of_interaction?.transaction_data?.qr_code ?? null, qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null, ticketUrl: payment.point_of_interaction?.transaction_data?.ticket_url ?? null });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, { status: 500 });
  }
});
