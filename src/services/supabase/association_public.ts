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
const DEFAULT_ASSOCIATION_WHATSAPP_MESSAGE =
  "Olá, vim pelo aplicativo AMA da Favela. Gostaria de obter mais informações sobre o anúncio do banner.";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeAssociationPhone(phone: string | null) {
  const raw = onlyDigits(phone ?? "");

  if (!raw) return null;

  return raw.startsWith("55") ? raw : `55${raw}`;
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

export function buildAssociationWhatsAppMessage(name?: string | null) {
  const safeName = name?.trim();

  if (!safeName) {
    return DEFAULT_ASSOCIATION_WHATSAPP_MESSAGE;
  }

  return `Olá! Vim pelo aplicativo AMA da Favela e gostaria de obter mais informações com ${safeName}.`;
}

export function buildAssociationWhatsAppUrl(
  phone: string | null,
  message = DEFAULT_ASSOCIATION_WHATSAPP_MESSAGE,
) {
  const normalizedPhone = normalizeAssociationPhone(phone);

  if (!normalizedPhone) return null;

  return `https://api.whatsapp.com/send/?phone=${normalizedPhone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
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

export async function getAssociationWhatsAppLink() {
  const contact = await getAssociationContactData();
  const message = buildAssociationWhatsAppMessage(contact.name);
  const url = buildAssociationWhatsAppUrl(contact.phone, message);

  if (!url) {
    throw new Error("WhatsApp da associação não disponível.");
  }

  return {
    contact,
    message,
    url,
  };
}

export function invalidateAssociationContactCache(community: string) {
  try {
    localStorage.removeItem(buildCacheKey(community));
  } catch {
    // noop
  }
}
