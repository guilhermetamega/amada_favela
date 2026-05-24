import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function sendRafflePurchaseEmail(params: {
  to: string;
  raffleTitle: string;
  numbers: number[];
  buyerName: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from =
    Deno.env.get("RAFFLE_EMAIL_FROM") ?? "Rifas <no-reply@amadafavela.com.br>";
  if (!apiKey) return;

  const html = `<h2>Compra confirmada</h2><p>Olá, ${params.buyerName}.</p><p>Sua compra da rifa <strong>${params.raffleTitle}</strong> foi confirmada.</p><p><strong>Números:</strong> ${params.numbers.join(", ")}</p>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: `Compra confirmada - ${params.raffleTitle}`,
      html,
    }),
  });
}

serve(async (req) => {
  if (req.method !== "POST")
    return new Response("method not allowed", { status: 405 });
  const url = new URL(req.url);
  const payload = await req.json().catch(() => ({}));
  const paymentId =
    payload?.data?.id ??
    payload?.resource?.id ??
    payload?.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");
  if (!paymentId) return new Response("ok", { status: 200 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: sellers } = await admin
    .from("sponsor_mercadopago_accounts")
    .select("access_token")
    .eq("status", "active");

  let payment: any = null;
  let fetched = false;
  for (const seller of sellers ?? []) {
    const token = seller?.access_token;
    if (!token) continue;

    const paymentRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!paymentRes.ok) continue;
    payment = await paymentRes.json();
    fetched = true;
    break;
  }

  if (!fetched || !payment)
    return new Response("payment not found", { status: 200 });

  if (payment.status === "approved") {
    const raffleId = payment.metadata?.raffle_id;
    const selectedNumbers = Array.isArray(payment.metadata?.selected_numbers)
      ? payment.metadata.selected_numbers
      : [];
    for (const n of selectedNumbers) {
      const ticketNumber = Number(n);
      if (!Number.isInteger(ticketNumber)) continue;

      const { data: existing } = await admin
        .from("raffle_tickets")
        .select("id")
        .eq("raffle_id", raffleId)
        .eq("ticket_number", ticketNumber)
        .maybeSingle();

      if (existing) continue;

      await admin.from("raffle_tickets").insert({
        raffle_id: raffleId,
        ticket_number: ticketNumber,
        buyer_name: payment.metadata?.buyer_name,
        buyer_phone: payment.metadata?.buyer_phone,
        buyer_instagram: payment.metadata?.buyer_instagram,
        buyer_email: payment.metadata?.buyer_email,
      });
    }

    const { data: raffle } = await admin
      .from("sponsor_raffles")
      .select("title")
      .eq("id", raffleId)
      .maybeSingle();

    const buyerEmail =
      typeof payment.metadata?.buyer_email === "string"
        ? payment.metadata.buyer_email
        : "";
    const buyerName =
      typeof payment.metadata?.buyer_name === "string"
        ? payment.metadata.buyer_name
        : "Comprador";

    if (buyerEmail) {
      await sendRafflePurchaseEmail({
        to: buyerEmail,
        raffleTitle: raffle?.title ?? "Rifa",
        numbers: selectedNumbers
          .map((n: unknown) => Number(n))
          .filter((n: number) => Number.isInteger(n)),
        buyerName,
      });
    }
  }

  return new Response("ok", { status: 200 });
});
