import { supabase } from "@/services/supabase/client";
import type { CreateRaffleInput, RafflePublicDetails, SponsorRaffle } from "@/types/raffle";

async function uploadRaffleImages(raffleId: string, files: File[]) {
  const paths: string[] = [];
  for (const [index, file] of files.entries()) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${raffleId}/${Date.now()}-${index}.${ext}`;
    const { error } = await supabase.storage.from("sponsor-raffles").upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    paths.push(path);
  }
  return paths;
}

export async function createSponsorRaffle(input: CreateRaffleInput) {
  const { data, error } = await supabase.rpc("create_sponsor_raffle", {
    input_title: input.title,
    input_description: input.description,
    input_sales_end_at: input.salesEndAt,
    input_total_numbers: input.totalNumbers,
    input_number_price_cents: input.numberPriceCents,
  });
  if (error || !data) throw new Error(error?.message || "Erro ao criar rifa.");

  const raffleId = data as string;
  const paths = await uploadRaffleImages(raffleId, input.images.slice(0, 4));

  if (paths.length > 0) {
    const { error: updateError } = await supabase.from("sponsor_raffles").update({ image_paths: paths }).eq("id", raffleId);
    if (updateError) throw new Error(updateError.message);
  }

  return raffleId;
}

export async function getSponsorRaffles() {
  const { data, error } = await supabase.from("sponsor_raffles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as SponsorRaffle[];
}

export async function getPublicRaffleBySlug(slug: string) {
  const { data, error } = await supabase.rpc("get_public_raffle", { input_slug: slug });
  if (error || !data) throw new Error(error?.message || "Rifa não encontrada.");
  return data as RafflePublicDetails;
}

export async function createRafflePixCheckout(payload: { raffleId: string; selectedNumbers: number[]; buyerName: string; buyerPhone: string; buyerInstagram?: string; buyerEmail?: string; }) {
  const { data, error } = await supabase.functions.invoke("raffle-create-pix", { body: payload });
  if (error) throw new Error(error.message || "Não foi possível gerar o pagamento PIX.");

  const maybeError = (data as { error?: string } | null)?.error;
  if (maybeError) throw new Error(maybeError);
  if (!data) throw new Error("Não foi possível gerar o pagamento PIX.");
  return data as { checkoutCode: string; qrCode: string | null; qrCodeBase64: string | null; ticketUrl: string | null; totalCents: number; };
}
