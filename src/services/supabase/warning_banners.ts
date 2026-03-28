import { supabase } from "@/services/supabase/client";
import type {
  CreateWarningBannerInput,
  UpdateWarningBannerInput,
  WarningBanner,
} from "@/types/warning_banners";

async function getCurrentProfile() {
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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, comunity")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile;
}

export async function createWarningBanner(input: CreateWarningBannerInput) {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("warning_banners")
    .insert({
      community: profile.comunity,
      message: input.message.trim(),
      text_color: input.text_color,
      background_image_url: "warning_bg",
      status: "active",
      created_by: profile.id,
      expires_at: input.expires_at,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WarningBanner;
}

export async function getCurrentCommunityWarningBanners() {
  const profile = await getCurrentProfile();

  const { data, error } = await supabase
    .from("warning_banners")
    .select("*")
    .eq("community", profile.comunity)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WarningBanner[];
}

export async function getEditableCurrentCommunityWarningBanners() {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("warning_banners")
    .select("*")
    .eq("community", profile.comunity)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WarningBanner[];
}

export async function updateWarningBanner(
  bannerId: string,
  input: UpdateWarningBannerInput,
) {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data: banner, error: bannerError } = await supabase
    .from("warning_banners")
    .select("id, community, status, expires_at")
    .eq("id", bannerId)
    .single();

  if (bannerError) {
    throw new Error(bannerError.message);
  }

  if (!banner) {
    throw new Error("Banner não encontrado.");
  }

  if (banner.community !== profile.comunity) {
    throw new Error("Você não pode editar banners de outra comunidade.");
  }

  const { data, error } = await supabase
    .from("warning_banners")
    .update({
      message: input.message.trim(),
      text_color: input.text_color,
      expires_at: input.expires_at,
    })
    .eq("id", bannerId)
    .eq("community", profile.comunity)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WarningBanner;
}
