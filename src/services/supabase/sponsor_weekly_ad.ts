import { getSponsorSessionToken } from "@/lib/sponsorSession";

import type { SponsorWeeklyAdResponse } from "@/types/sponsor-weekly-ad";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type ErrorResponse = {
  message?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSponsorSessionToken();

  if (!token) {
    throw new Error("Sessão do patrocinador não encontrada.");
  }

  const headers = new Headers(options.headers);

  headers.set("apikey", anonKey);

  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${supabaseUrl}/functions/v1/${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => null)) as
    | T
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Erro na requisição.",
    );
  }

  if (!data) {
    throw new Error("A função não retornou uma resposta válida.");
  }

  return data as T;
}

export async function getSponsorWeeklyAd() {
  return request<SponsorWeeklyAdResponse>("sponsor-weekly-ad-get", {
    method: "GET",
  });
}

export async function saveSponsorWeeklyAd(input: {
  community: string;
  storeName: string;
  phone: string;
  validUntil: string;
  imagePrimary?: File | null;
  imageSecondary?: File | null;
}) {
  const community = input.community.trim();

  if (!community) {
    throw new Error("Selecione a comunidade da propaganda.");
  }

  const formData = new FormData();

  formData.append("community", community);

  formData.append("storeName", input.storeName.trim());

  formData.append("phone", input.phone.trim());

  formData.append("validUntil", input.validUntil);

  if (input.imagePrimary) {
    formData.append("imagePrimary", input.imagePrimary);
  }

  if (input.imageSecondary) {
    formData.append("imageSecondary", input.imageSecondary);
  }

  return request<SponsorWeeklyAdResponse>("sponsor-weekly-ad-save", {
    method: "POST",
    body: formData,
  });
}

export async function deleteSponsorWeeklyAd() {
  return request<SponsorWeeklyAdResponse>("sponsor-weekly-ad-delete", {
    method: "DELETE",
  });
}

export function buildWhatsappUrl(phone: string | null) {
  const rawDigits = (phone ?? "").replace(/\D/g, "");

  if (!rawDigits) {
    return "#";
  }

  const digits = rawDigits.startsWith("55") ? rawDigits : `55${rawDigits}`;

  const message =
    "Olá, vim pelo aplicativo da associação de moradores. Gostaria de obter mais informações sobre o anúncio.";

  return (
    "https://api.whatsapp.com/send" +
    `?phone=${digits}` +
    `&text=${encodeURIComponent(message)}`
  );
}
