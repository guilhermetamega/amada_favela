import { supabase } from "@/services/supabase/client";
import type { DiscountStore, StoreCatalogItem } from "@/types/discount_club";

export const STORE_CATALOG_URL = "https://lojasdomandela.com/lojas-1.json";
const BUCKET_NAME = "discount_club";

type JsonRecord = Record<string, unknown>;

function firstString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function recordsFromJson(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is JsonRecord => !!item && typeof item === "object");
  if (!value || typeof value !== "object") return [];
  const record = value as JsonRecord;
  for (const key of ["lojas", "stores", "data", "items", "results"]) {
    if (Array.isArray(record[key])) return recordsFromJson(record[key]);
  }
  return Object.values(record).filter((item): item is JsonRecord => !!item && typeof item === "object" && !Array.isArray(item));
}

export function normalizeStoreCatalog(value: unknown): StoreCatalogItem[] {
  return recordsFromJson(value).map((record, index) => {
    const nested = (record.loja ?? record.store ?? record.data) as JsonRecord | undefined;
    const source = nested && typeof nested === "object" ? { ...record, ...nested } : record;
    const name = firstString(source, ["nome", "name", "loja", "title", "nome_loja"]) ?? "Loja sem nome";
    const id = firstString(source, ["id", "loja_id", "slug", "uuid", "codigo"]) ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`;
    const premiumValue = source.premium ?? source.premium_no_lojas ?? source.is_premium ?? source.verificado;
    const photo = firstString(source, ["foto", "foto_url", "imagem", "image", "logo", "avatar", "url_foto"]);
    return {
      id,
      name,
      niche: firstString(source, ["nicho", "categoria", "segmento", "ramo", "type"]),
      community: firstString(source, ["comunidade", "community", "favela", "localidade"]),
      photoUrl: photo,
      whatsapp: firstString(source, ["whatsapp", "telefone", "celular", "phone", "contato"]),
      premium: premiumValue === true || premiumValue === 1 || premiumValue === "true" || premiumValue === "sim" || premiumValue === "Premium",
      sourceData: record,
    };
  }).filter((store) => store.name !== "Loja sem nome");
}

export async function getStoreCatalog() {
  const { data, error } = await supabase.functions.invoke("discount-club-catalog", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (error) {
    throw new Error(`Não foi possível consultar o catálogo via Supabase. Confirme que a Edge Function discount-club-catalog está ativa. ${error.message}`);
  }
  return normalizeStoreCatalog(data as unknown);
}

async function getCurrentProfile() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("Usuário não autenticado.");
  const { data, error } = await supabase.from("users").select("id, role, comunity").eq("id", user.id).single();
  if (error) throw new Error(error.message);
  if (!data.comunity) throw new Error("Seu perfil não possui uma comunidade definida.");
  if (!["employee", "president", "admin"].includes(data.role)) throw new Error("Acesso não autorizado.");
  return data;
}

export async function getDiscountStores() {
  const { data, error } = await supabase.from("discount_club_stores").select("*").eq("status", "active").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as DiscountStore[];
}

export async function getAdminDiscountStores() {
  const profile = await getCurrentProfile();
  let query = supabase.from("discount_club_stores").select("*").order("updated_at", { ascending: false });
  if (profile.role !== "admin") query = query.eq("community", profile.comunity);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as DiscountStore[];
}

async function uploadPhoto(file: File, userId: string) {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${extension.replace(/[^a-zA-Z0-9]/g, "")}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl;
}

export async function saveDiscountStore(store: StoreCatalogItem, discountPercent: number, photoFile: File | null, status: "active" | "inactive", existingId?: string) {
  const profile = await getCurrentProfile();
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) throw new Error("Informe um desconto entre 1% e 100%.");
  const photoUrl = photoFile ? await uploadPhoto(photoFile, profile.id) : store.photoUrl;
  const { data, error } = await supabase.from("discount_club_stores").upsert({
    ...(existingId ? { id: existingId } : {}),
    api_store_id: store.id,
    name: store.name,
    niche: store.niche,
    community: profile.comunity,
    photo_url: photoUrl,
    whatsapp: store.whatsapp,
    premium: store.premium,
    discount_percent: discountPercent,
    status,
    source_data: store.sourceData,
    created_by: profile.id,
  }, { onConflict: "community,api_store_id" }).select().single();
  if (error) throw new Error(error.message);
  return data as DiscountStore;
}

export async function updateDiscountStoreStatus(id: string, status: "active" | "inactive") {
  await getCurrentProfile();
  const { data, error } = await supabase.from("discount_club_stores").update({ status }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as DiscountStore;
}

export async function deleteDiscountStore(id: string) {
  await getCurrentProfile();
  const { error } = await supabase.from("discount_club_stores").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
