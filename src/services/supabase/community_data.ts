import { supabase } from "@/services/supabase/client";
import type {
  CommunityData,
  CommunityProfile,
  UpsertCommunityDataInput,
} from "@/types/community_data";

const BUCKET_NAME = "community_image";
const DEFAULT_DESCRIPTION = "Tecnologia para conectar a favela ao futuro";

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

export async function getCurrentCommunityProfile() {
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
    .select("id, role, comunity")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CommunityProfile;
}

export async function getCommunityDataByCommunity(community: string) {
  const { data, error } = await supabase
    .from("community_data")
    .select("id, picture_path, community, description, created_at")
    .eq("community", community)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CommunityData | null;
}

export async function getCommunityImageSignedUrl(path: string) {
  const trimmedPath = path.trim();

  if (!trimmedPath) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(trimmedPath, 60 * 60);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

async function uploadCommunityImage(file: File, community: string) {
  const ext = file.name.split(".").pop() ?? "png";
  const baseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const safeCommunity = sanitizeFileName(community);
  const filePath = `${safeCommunity}/${Date.now()}-${baseName}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return filePath;
}

export async function upsertCurrentCommunityData(
  input: UpsertCommunityDataInput,
) {
  const profile = await getCurrentCommunityProfile();

  if (!profile.comunity) {
    throw new Error("Seu perfil não possui comunidade definida.");
  }

  if (!["admin", "president"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const current = await getCommunityDataByCommunity(profile.comunity);

  let picturePath = current?.picture_path ?? "";

  if (input.pictureFile) {
    picturePath = await uploadCommunityImage(
      input.pictureFile,
      profile.comunity,
    );
  }

  if (!picturePath) {
    throw new Error("Envie uma logo da associação.");
  }

  const payload = {
    picture_path: picturePath,
    community: profile.comunity,
    description: input.description.trim() || DEFAULT_DESCRIPTION,
  };

  if (current?.id) {
    const { data, error } = await supabase
      .from("community_data")
      .update(payload)
      .eq("id", current.id)
      .select("id, picture_path, community, description, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as CommunityData;
  }

  const { data, error } = await supabase
    .from("community_data")
    .insert(payload)
    .select("id, picture_path, community, description, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CommunityData;
}

export async function getCurrentCommunityBannerData() {
  const profile = await getCurrentCommunityProfile();

  if (!profile.comunity) {
    return {
      profile,
      communityData: null as CommunityData | null,
    };
  }

  const communityData = await getCommunityDataByCommunity(profile.comunity);

  return {
    profile,
    communityData,
  };
}
