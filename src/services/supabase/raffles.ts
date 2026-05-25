import { getSponsorProfile } from "@/lib/sponsorSession";
import { SUPABASE_CONFIG_ERROR, supabase } from "@/services/supabase/client";
import type {
  CreateRaffleInput,
  RafflePhoneLookupResult,
  RafflePublicDetails,
  SponsorRaffleInsights,
  SponsorRaffle,
} from "@/types/raffle";

async function uploadRaffleImages(raffleId: string, files: File[]) {
  const paths: string[] = [];
  for (const [index, file] of files.entries()) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${raffleId}/${Date.now()}-${index}.${ext}`;
    const { error } = await supabase.storage
      .from("sponsor-raffles")
      .upload(path, file, { upsert: false });
    if (error) {
      console.warn("[raffles] image upload skipped", {
        path,
        message: error.message,
      });
      continue;
    }
    paths.push(path);
  }
  return paths;
}

export async function createSponsorRaffle(input: CreateRaffleInput) {
  const sponsorId = getSponsorProfile()?.sponsor.id;
  if (!sponsorId) throw new Error("Sessão de patrocinador inválida.");

  const { data, error } = await supabase.rpc("create_sponsor_raffle", {
    input_title: input.title,
    input_description: input.description,
    input_sales_end_at: input.salesEndAt,
    input_total_numbers: input.totalNumbers,
    input_number_price_cents: input.numberPriceCents,
    input_sponsor_id: sponsorId,
  });
  if (error || !data) throw new Error(error?.message || "Erro ao criar rifa.");

  const raffleId = data as string;
  const paths = await uploadRaffleImages(raffleId, input.images.slice(0, 4));

  if (paths.length > 0) {
    const { error: updateError } = await supabase
      .from("sponsor_raffles")
      .update({ image_paths: paths })
      .eq("id", raffleId);
    if (updateError) throw new Error(updateError.message);
  }

  return raffleId;
}

export async function getSponsorRaffles() {
  const { data, error } = await supabase
    .from("sponsor_raffles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as SponsorRaffle[];
}

export async function getPublicRaffleBySlug(slug: string) {
  if (SUPABASE_CONFIG_ERROR) throw new Error(SUPABASE_CONFIG_ERROR);
  const { data, error } = await supabase.rpc("get_public_raffle", {
    input_slug: slug,
  });
  if (error || !data) throw new Error(error?.message || "Rifa não encontrada.");
  return data as RafflePublicDetails;
}

async function parseFunctionErrorResponse(response: Response) {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (payload && typeof payload === "object") {
    const maybeError = (payload as { error?: unknown }).error;
    const maybeCode = (payload as { code?: unknown }).code;
    const maybeDebug = (payload as { debugStep?: unknown }).debugStep;
    const message = typeof maybeError === "string" ? maybeError : "";
    const suffix = [maybeCode, maybeDebug]
      .filter((item) => typeof item === "string" && item.length > 0)
      .join(" | ");
    if (message) return suffix ? `${message} (${suffix})` : message;
  }

  return `Falha HTTP ${response.status} ao gerar pagamento PIX.`;
}

export async function createRafflePixCheckout(payload: {
  raffleId: string;
  selectedNumbers: number[];
  buyerName: string;
  buyerPhone: string;
  buyerInstagram?: string;
  buyerEmail?: string;
}) {
  console.info("[raffles] createRafflePixCheckout payload", {
    raffleId: payload.raffleId,
    selectedCount: payload.selectedNumbers.length,
    hasBuyerName: !!payload.buyerName,
    hasBuyerPhone: !!payload.buyerPhone,
    hasBuyerEmail: !!payload.buyerEmail,
  });
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/raffle-create-pix`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await parseFunctionErrorResponse(response);
    console.error("[raffles] invoke error", {
      status: response.status,
      message,
    });
    throw new Error(message);
  }

  const data = (await response.json()) as { error?: string } | null;
  console.info("[raffles] invoke data", data);
  const maybeError = data?.error;
  if (maybeError) throw new Error(maybeError);
  if (!data) throw new Error("Não foi possível gerar o pagamento PIX.");
  return data as {
    checkoutCode: string;
    qrCode: string | null;
    qrCodeBase64: string | null;
    ticketUrl: string | null;
    totalCents: number;
  };
}

export async function getSponsorRaffleStatus() {
  const token = localStorage.getItem("sponsor_session_token");
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sponsor-raffle-status`,
    {
      method: "GET",
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok)
    throw new Error("Não foi possível verificar conexão do Mercado Pago.");
  return (await response.json()) as {
    connected: boolean;
    message: string;
    status: string;
  };
}

export async function startSponsorMercadoPagoConnect() {
  const token = localStorage.getItem("sponsor_session_token");
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sponsor-mercadopago-connect-start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
    },
  );

  const data = (await response.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;
  if (!response.ok || !data?.url) {
    throw new Error(
      data?.error || "Não foi possível iniciar conexão com Mercado Pago.",
    );
  }
  return data.url;
}

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "");
}

export async function getSponsorRaffleInsights(
  raffleId: string,
): Promise<SponsorRaffleInsights> {
  const { data: raffle, error: raffleError } = await supabase
    .from("sponsor_raffles")
    .select("*")
    .eq("id", raffleId)
    .single();
  if (raffleError || !raffle) throw new Error("Rifa não encontrada.");

  const { data: tickets, error: ticketsError } = await supabase
    .from("raffle_tickets")
    .select(
      "ticket_number,buyer_name,buyer_instagram,buyer_phone,buyer_email,created_at",
    )
    .eq("raffle_id", raffleId)
    .order("created_at", { ascending: true });

  if (ticketsError) throw new Error(ticketsError.message);
  const safeTickets = tickets ?? [];
  const totalRaisedCents = safeTickets.length * raffle.number_price_cents;

  const dailyMap = new Map<string, number>();
  for (const ticket of safeTickets) {
    const key = new Date(ticket.created_at).toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + raffle.number_price_cents);
  }

  const dailyRevenue = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, amount_cents]) => ({ day, amount_cents }));

  const winningTicket =
    typeof raffle.winning_number === "number"
      ? safeTickets.find((it) => it.ticket_number === raffle.winning_number)
      : null;

  return {
    raffle,
    total_raised_cents: totalRaisedCents,
    daily_revenue: dailyRevenue,
    winner: winningTicket
      ? {
          buyer_name: winningTicket.buyer_name,
          buyer_instagram: winningTicket.buyer_instagram,
          buyer_phone: winningTicket.buyer_phone,
          buyer_email: winningTicket.buyer_email,
          ticket_number: winningTicket.ticket_number,
        }
      : null,
  };
}

export async function lookupRaffleTicketsByPhone(payload: {
  raffleId: string;
  phone: string;
}): Promise<RafflePhoneLookupResult> {
  const phone = normalizePhone(payload.phone);
  if (!phone) throw new Error("Informe um telefone válido.");

  const { data, error } = await supabase
    .from("raffle_tickets")
    .select("ticket_number,buyer_phone")
    .eq("raffle_id", payload.raffleId);

  if (error) throw new Error(error.message);

  const ticketNumbers = (data ?? [])
    .filter((row) => normalizePhone(row.buyer_phone ?? "") === phone)
    .map((row) => Number(row.ticket_number))
    .filter(Number.isInteger)
    .sort((a, b) => a - b);

  return {
    phone: payload.phone,
    total_tickets: ticketNumbers.length,
    ticket_numbers: ticketNumbers,
  };
}
