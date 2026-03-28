import { supabase } from "@/services/supabase/client";

type CurrentProfileRow = {
  id: string;
  comunity: string | null;
};

export type AssociationContactData = {
  community: string;
  name: string;
  phone: string | null;
};

const CACHE_PREFIX = "association-contact";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function buildCacheKey(community: string) {
  return `${CACHE_PREFIX}:${community.toLowerCase()}`;
}

function readCache(community: string): AssociationContactData | null {
  try {
    const raw = localStorage.getItem(buildCacheKey(community));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      expiresAt: number;
      value: AssociationContactData;
    };

    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(buildCacheKey(community));
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache(community: string, value: AssociationContactData) {
  try {
    localStorage.setItem(
      buildCacheKey(community),
      JSON.stringify({
        expiresAt: Date.now() + CACHE_TTL_MS,
        value,
      }),
    );
  } catch {
    // noop
  }
}

async function getCurrentProfileRow(): Promise<CurrentProfileRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, comunity")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível carregar a comunidade do usuário.");
  }

  return data as CurrentProfileRow;
}

export function buildAssociationWhatsAppUrl(phone: string | null) {
  const digits = onlyDigits(phone ?? "");

  if (!digits) return null;

  return `https://wa.me/+55${digits}`;
}

export async function getAssociationContactData() {
  const profile = await getCurrentProfileRow();

  if (!profile.comunity) {
    throw new Error("Comunidade do usuário não encontrada.");
  }

  const cached = readCache(profile.comunity);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("association")
    .select("community, name, phone")
    .eq("community", profile.comunity)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível carregar o contato da associação.");
  }

  const value: AssociationContactData = {
    community: data.community,
    name: data.name,
    phone: data.phone ?? null,
  };

  writeCache(profile.comunity, value);

  return value;
}

export function invalidateAssociationContactCache(community: string) {
  try {
    localStorage.removeItem(buildCacheKey(community));
  } catch {
    // noop
  }
}
