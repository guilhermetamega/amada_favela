import { supabase } from "@/services/supabase/client";
import type {
  MyListingsData,
  PartnerHistoryItem,
  ProfileUser,
  UpdateHomeRentInput,
  UpdateLostAndFoundInput,
  UpdateLostAnimalInput,
  UpdateProfileInput,
} from "@/types/profile";
import type { HomeRentItem } from "@/types/home_rent";
import type { LostAndFoundItem } from "@/types/lost_and_found";
import type { LostAnimalsItem } from "@/types/lost_animals";

const PROFILE_BUCKET = "profile_pic";
const LOST_ANIMALS_BUCKET = "lost_animals";
const LOST_AND_FOUND_BUCKET = "lost_and_found";
const HOME_RENT_BUCKET = "home_rent";

type UserProfileRoleRow = {
  id: string;
  role: ProfileUser["role"];
};

type PartnerStatusRow = {
  expires_at: string;
};

type StorageSignedUrlRow = {
  signedUrl: string;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

function getFileExtension(file: File) {
  const fileNameExtension = file.name.split(".").pop()?.toLowerCase();

  if (
    fileNameExtension &&
    ["jpg", "jpeg", "png", "webp"].includes(fileNameExtension)
  ) {
    return fileNameExtension;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function validateProfilePicture(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeInBytes = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Envie uma imagem JPG, PNG ou WEBP.");
  }

  if (file.size > maxSizeInBytes) {
    throw new Error("A foto deve ter no máximo 5 MB.");
  }
}

export async function deleteMyAccount() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Erro ao verificar sessão atual.");
  }

  if (!session?.access_token) {
    throw new Error("Sessão expirada ou usuário não autenticado.");
  }

  const { data, error } = await supabase.functions.invoke("delete-my-account", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: {},
  });

  if (error) {
    throw new Error(
      error.message || "Não foi possível excluir sua conta no momento.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message || "Não foi possível concluir a exclusão da conta.",
    );
  }

  return data as { success: true; message: string };
}
function getPublicFilePathFromUrl(
  url: string | null | undefined,
  bucket: string,
) {
  if (!url) return null;

  try {
    const normalizedBucket = `/${bucket}/`;
    const parsedUrl = new URL(url);
    const marker = parsedUrl.pathname.indexOf(normalizedBucket);

    if (marker === -1) return null;

    return decodeURIComponent(
      parsedUrl.pathname.slice(marker + normalizedBucket.length),
    );
  } catch {
    return null;
  }
}

async function deleteStorageFileIfExists(
  bucket: string,
  publicUrl: string | null | undefined,
) {
  const filePath = getPublicFilePathFromUrl(publicUrl, bucket);

  if (!filePath) return;

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    throw new Error(error.message);
  }
}

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return user.id;
}

export async function getCurrentUserProfile(userId: string) {
  const { data: profile, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .single<UserProfileRoleRow>();

  if (error) {
    throw new Error(error.message);
  }

  return profile;
}

export async function getPartnerStatus(userId: string) {
  const { data, error } = await supabase
    .from("partners")
    .select("expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<PartnerStatusRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return false;

  return new Date(data.expires_at) >= new Date();
}

export async function getMyProfile() {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, fullname, cpf, birth, address_1, address_2, zipcode, comunity, email, phone, role, picture_path, created_at",
    )
    .eq("id", userId)
    .single<ProfileUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateMyProfile(input: UpdateProfileInput) {
  const userId = await getAuthenticatedUserId();

  const payload = {
    fullname: input.fullname.trim(),
    address_1: input.address_1.trim() || null,
    address_2: input.address_2.trim() || null,
    zipcode: input.zipcode.trim() || null,
    phone: input.phone.trim() || null,
  };

  if (!payload.fullname) {
    throw new Error("Informe seu nome completo.");
  }

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select(
      "id, fullname, cpf, birth, address_1, address_2, zipcode, comunity, email, phone, role, picture_path, created_at",
    )
    .single<ProfileUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSignedFileUrl(
  bucket: string,
  filePath: string | null | undefined,
  expiresIn = 3600,
) {
  if (!filePath) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(error.message);
  }

  return (data as StorageSignedUrlRow).signedUrl;
}

export async function getMyAvatarSignedUrl(
  picturePath: string | null | undefined,
  expiresIn = 3600,
) {
  return getSignedFileUrl(PROFILE_BUCKET, picturePath, expiresIn);
}

export async function uploadMyAvatar(file: File) {
  const userId = await getAuthenticatedUserId();
  validateProfilePicture(file);

  const profile = await getMyProfile();

  if (profile.picture_path) {
    const { error: removeError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .remove([profile.picture_path]);

    if (removeError) {
      throw new Error(removeError.message);
    }
  }

  const extension = getFileExtension(file);
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const filePath = `${userId}/${Date.now()}-${safeName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error } = await supabase
    .from("users")
    .update({ picture_path: filePath })
    .eq("id", userId)
    .select(
      "id, fullname, cpf, birth, address_1, address_2, zipcode, comunity, email, phone, role, picture_path, created_at",
    )
    .single<ProfileUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteMyAvatar() {
  const userId = await getAuthenticatedUserId();
  const profile = await getMyProfile();

  if (profile.picture_path) {
    const { error: removeError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .remove([profile.picture_path]);

    if (removeError) {
      throw new Error(removeError.message);
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update({ picture_path: null })
    .eq("id", userId)
    .select(
      "id, fullname, cpf, birth, address_1, address_2, zipcode, comunity, email, phone, role, picture_path, created_at",
    )
    .single<ProfileUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateMyPassword(newPassword: string) {
  const sanitizedPassword = newPassword.trim();

  if (sanitizedPassword.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }

  const { error } = await supabase.auth.updateUser({
    password: sanitizedPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getMyPartnerHistory() {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("partners")
    .select("id, user_id, created_at, expires_at, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PartnerHistoryItem[];
}

export async function getMyListings() {
  const userId = await getAuthenticatedUserId();

  const [lostAnimalsResult, lostAndFoundResult, homeRentResult] =
    await Promise.all([
      supabase
        .from("lost_animals")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("lost_and_found")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("home_rent")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false }),
    ]);

  if (lostAnimalsResult.error) throw new Error(lostAnimalsResult.error.message);
  if (lostAndFoundResult.error)
    throw new Error(lostAndFoundResult.error.message);
  if (homeRentResult.error) throw new Error(homeRentResult.error.message);

  return {
    lostAnimals: (lostAnimalsResult.data ?? []) as LostAnimalsItem[],
    lostAndFound: (lostAndFoundResult.data ?? []) as LostAndFoundItem[],
    homeRent: (homeRentResult.data ?? []) as HomeRentItem[],
  } satisfies MyListingsData;
}

export async function updateMyLostAnimal(
  id: string,
  input: UpdateLostAnimalInput,
) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("lost_animals")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      type: input.type,
      phone: input.phone.trim(),
    })
    .eq("id", id)
    .eq("created_by", userId)
    .select("*")
    .single<LostAnimalsItem>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function closeMyLostAnimal(id: string) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("lost_animals")
    .update({ status: "resolved" })
    .eq("id", id)
    .eq("created_by", userId)
    .select("*")
    .single<LostAnimalsItem>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteMyLostAnimal(id: string) {
  const userId = await getAuthenticatedUserId();

  const { data: item, error: selectError } = await supabase
    .from("lost_animals")
    .select("pic_1_url, pic_2_url, pic_3_url")
    .eq("id", id)
    .eq("created_by", userId)
    .single<Pick<LostAnimalsItem, "pic_1_url" | "pic_2_url" | "pic_3_url">>();

  if (selectError) {
    throw new Error(selectError.message);
  }

  const { error } = await supabase
    .from("lost_animals")
    .delete()
    .eq("id", id)
    .eq("created_by", userId);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    deleteStorageFileIfExists(LOST_ANIMALS_BUCKET, item.pic_1_url),
    deleteStorageFileIfExists(LOST_ANIMALS_BUCKET, item.pic_2_url),
    deleteStorageFileIfExists(LOST_ANIMALS_BUCKET, item.pic_3_url),
  ]);
}

export async function updateMyLostAndFound(
  id: string,
  input: UpdateLostAndFoundInput,
) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("lost_and_found")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      phone: input.phone.trim(),
    })
    .eq("id", id)
    .eq("created_by", userId)
    .select("*")
    .single<LostAndFoundItem>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function closeMyLostAndFound(id: string) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("lost_and_found")
    .update({ status: "resolved" })
    .eq("id", id)
    .eq("created_by", userId)
    .select("*")
    .single<LostAndFoundItem>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteMyLostAndFound(id: string) {
  const userId = await getAuthenticatedUserId();

  const { data: item, error: selectError } = await supabase
    .from("lost_and_found")
    .select("pic_1_url, pic_2_url, pic_3_url")
    .eq("id", id)
    .eq("created_by", userId)
    .single<Pick<LostAndFoundItem, "pic_1_url" | "pic_2_url" | "pic_3_url">>();

  if (selectError) {
    throw new Error(selectError.message);
  }

  const { error } = await supabase
    .from("lost_and_found")
    .delete()
    .eq("id", id)
    .eq("created_by", userId);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    deleteStorageFileIfExists(LOST_AND_FOUND_BUCKET, item.pic_1_url),
    deleteStorageFileIfExists(LOST_AND_FOUND_BUCKET, item.pic_2_url),
    deleteStorageFileIfExists(LOST_AND_FOUND_BUCKET, item.pic_3_url),
  ]);
}

export async function updateMyHomeRent(id: string, input: UpdateHomeRentInput) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("home_rent")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      address: input.address.trim(),
      phone: input.phone.trim(),
    })
    .eq("id", id)
    .eq("created_by", userId)
    .select("*")
    .single<HomeRentItem>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function closeMyHomeRent(id: string) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("home_rent")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("created_by", userId)
    .select("*")
    .single<HomeRentItem>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteMyHomeRent(id: string) {
  const userId = await getAuthenticatedUserId();

  const { data: item, error: selectError } = await supabase
    .from("home_rent")
    .select("pic_1_url, pic_2_url, pic_3_url")
    .eq("id", id)
    .eq("created_by", userId)
    .single<Pick<HomeRentItem, "pic_1_url" | "pic_2_url" | "pic_3_url">>();

  if (selectError) {
    throw new Error(selectError.message);
  }

  const { error } = await supabase
    .from("home_rent")
    .delete()
    .eq("id", id)
    .eq("created_by", userId);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    deleteStorageFileIfExists(HOME_RENT_BUCKET, item.pic_1_url),
    deleteStorageFileIfExists(HOME_RENT_BUCKET, item.pic_2_url),
    deleteStorageFileIfExists(HOME_RENT_BUCKET, item.pic_3_url),
  ]);
}
