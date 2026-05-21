import { getSponsorProfile } from "@/lib/sponsorSession";
import { supabase } from "@/services/supabase/client";
import type {
  CreateRaffleInput,
  RafflePublicDetails,
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
    if (error) throw new Error(error.message);
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
