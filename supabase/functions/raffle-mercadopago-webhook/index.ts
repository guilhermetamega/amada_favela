import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const payload = await req.json();
  const paymentId = payload?.data?.id;
  if (!paymentId) return new Response("ok", { status: 200 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}` } });
  const payment = await paymentRes.json();
  if (!paymentRes.ok) return new Response("mp error", { status: 400 });

  if (payment.status === "approved") {
    const raffleId = payment.metadata?.raffle_id;
    const selectedNumbers = payment.metadata?.selected_numbers || [];
    for (const n of selectedNumbers) {
      await admin.from("raffle_tickets").insert({ raffle_id: raffleId, ticket_number: n, buyer_name: payment.metadata?.buyer_name, buyer_phone: payment.metadata?.buyer_phone, buyer_instagram: payment.metadata?.buyer_instagram, buyer_email: payment.metadata?.buyer_email });
    }
  }

  return new Response("ok", { status: 200 });
});
