import type { SponsorWeeklyAdResponse } from "@/types/sponsor-weekly-ad";
import { getSponsorSessionToken } from "@/lib/sponsorSession";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function request(path: string, options: RequestInit = {}) {
  const token = getSponsorSessionToken();

  if (!token) {
    throw new Error("Sessão do patrocinador não encontrada.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Erro na requisição.");
  }

  return data;
}

export async function getSponsorWeeklyAd() {
  const data = await request("sponsor-weekly-ad-get", {
    method: "GET",
  });

  return data as SponsorWeeklyAdResponse;
}

export async function saveSponsorWeeklyAd(input: {
  storeName: string;
  phone: string;
  validUntil: string;
  imagePrimary?: File | null;
  imageSecondary?: File | null;
}) {
  const formData = new FormData();
  formData.append("storeName", input.storeName);
  formData.append("phone", input.phone);
  formData.append("validUntil", input.validUntil);

  if (input.imagePrimary) {
    formData.append("imagePrimary", input.imagePrimary);
  }

  if (input.imageSecondary) {
    formData.append("imageSecondary", input.imageSecondary);
  }

  const data = await request("sponsor-weekly-ad-save", {
    method: "POST",
    body: formData,
  });

  return data as SponsorWeeklyAdResponse;
}

export async function deleteSponsorWeeklyAd() {
  const data = await request("sponsor-weekly-ad-delete", {
    method: "DELETE",
  });

  return data as SponsorWeeklyAdResponse;
}

export function buildWhatsappUrl(phone: string | null) {
  const rawDigits = (phone ?? "").replace(/\D/g, "");

  if (!rawDigits) return "null";

  const digits = rawDigits.startsWith("55") ? rawDigits : `55${rawDigits}`;
  const message =
    "Olá, vim pelo aplicativo AMA da Favela. Gostaria de obter mais informações sobre o anúncio do banner.";

  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
}
