import { getSponsorSessionToken } from "@/lib/sponsorSession";
import type {
  SponsorStoreBannerDeleteResponse,
  SponsorStoreBannerGetResponse,
  SponsorStoreBannerSaveResponse,
} from "@/types/sponsor-store-banner";

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

export async function getSponsorStoreBanner() {
  const data = await request("sponsor-store-banner-get", {
    method: "GET",
  });

  return data as SponsorStoreBannerGetResponse;
}

export async function saveSponsorStoreBanner(input: {
  selectedFeatureKeys: string[];
  image?: File | null;
}) {
  const formData = new FormData();
  formData.append(
    "selectedFeatureKeys",
    JSON.stringify(input.selectedFeatureKeys),
  );

  if (input.image) {
    formData.append("image", input.image);
  }

  const data = await request("sponsor-store-banner-save", {
    method: "POST",
    body: formData,
  });

  return data as SponsorStoreBannerSaveResponse;
}

export async function deleteSponsorStoreBanner() {
  const data = await request("sponsor-store-banner-delete", {
    method: "DELETE",
  });

  return data as SponsorStoreBannerDeleteResponse;
}
