import { getSponsorSessionToken } from "@/lib/sponsorSession";

import type {
  SponsorStoreBannerDeleteResponse,
  SponsorStoreBannerGetResponse,
  SponsorStoreBannerSaveResponse,
} from "@/types/sponsor-store-banner";

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
      typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
        ? data.message
        : "Erro na requisição.",
    );
  }

  if (!data) {
    throw new Error("A função não retornou uma resposta válida.");
  }

  return data as T;
}

export async function getSponsorStoreBanner() {
  return request<SponsorStoreBannerGetResponse>("sponsor-store-banner-get", {
    method: "GET",
  });
}

export async function saveSponsorStoreBanner(input: {
  community: string;
  selectedFeatureKeys: string[];
  image?: File | null;
}) {
  const community = input.community.trim();

  if (!community) {
    throw new Error("Selecione a comunidade da propaganda.");
  }

  if (input.selectedFeatureKeys.length === 0) {
    throw new Error("Selecione ao menos uma função para o banner.");
  }

  const formData = new FormData();

  formData.append("community", community);

  formData.append(
    "selectedFeatureKeys",
    JSON.stringify(input.selectedFeatureKeys),
  );

  if (input.image) {
    formData.append("image", input.image);
  }

  return request<SponsorStoreBannerSaveResponse>("sponsor-store-banner-save", {
    method: "POST",
    body: formData,
  });
}

export async function deleteSponsorStoreBanner() {
  return request<SponsorStoreBannerDeleteResponse>(
    "sponsor-store-banner-delete",
    {
      method: "DELETE",
    },
  );
}
