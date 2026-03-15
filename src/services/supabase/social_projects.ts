import { supabase } from "@/services/supabase/client";
import type {
  CreateSocialProjectInput,
  SocialProjectItem,
  UpdateSocialProjectInput,
} from "@/types/social_projects";

const BUCKET_NAME = "social_projects";

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

async function uploadImage(file: File, userId: string) {
  const fileExt = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const filePath = `${userId}/${Date.now()}-${safeName}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return data.publicUrl;
}

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

function ensureCanManage(role: string) {
  if (!["employee", "president", "admin"].includes(role)) {
    throw new Error("Acesso não autorizado.");
  }
}

export async function getSocialProjectsItems() {
  const { data, error } = await supabase
    .from("social_projects")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SocialProjectItem[];
}

export async function getSocialProjectItemById(id: string) {
  const { data, error } = await supabase
    .from("social_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SocialProjectItem;
}

export async function getAdminSocialProjectsItems() {
  const profile = await getCurrentProfile();
  ensureCanManage(profile.role);

  const query = supabase
    .from("social_projects")
    .select("*")
    .order("created_at", { ascending: false });

  const { data, error } =
    profile.role === "admin"
      ? await query
      : await query.eq("community", profile.comunity);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SocialProjectItem[];
}

export async function createSocialProjectItem(input: CreateSocialProjectInput) {
  const profile = await getCurrentProfile();
  ensureCanManage(profile.role);

  const pic1Url = await uploadImage(input.pic1, profile.id);
  const pic2Url = input.pic2 ? await uploadImage(input.pic2, profile.id) : null;
  const pic3Url = input.pic3 ? await uploadImage(input.pic3, profile.id) : null;

  const { data, error } = await supabase
    .from("social_projects")
    .insert({
      title: input.title.trim(),
      community: profile.comunity,
      description: input.description.trim(),
      status: input.status,
      contact_phone: input.contact_phone.trim(),
      address: input.address.trim() || null,
      pix_key: input.pix_key.trim() || null,
      volunteer_info: input.volunteer_info.trim() || null,
      pic_1_url: pic1Url,
      pic_2_url: pic2Url,
      pic_3_url: pic3Url,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SocialProjectItem;
}

export async function updateSocialProjectItem(
  id: string,
  input: UpdateSocialProjectInput,
) {
  const profile = await getCurrentProfile();
  ensureCanManage(profile.role);

  const current = await getSocialProjectItemById(id);

  if (
    profile.role !== "admin" &&
    current.community.toLowerCase() !== String(profile.comunity).toLowerCase()
  ) {
    throw new Error("Você não pode editar projetos de outra comunidade.");
  }

  let pic1Url = current.pic_1_url;
  let pic2Url = current.pic_2_url;
  let pic3Url = current.pic_3_url;

  if (input.pic1 instanceof File) {
    pic1Url = await uploadImage(input.pic1, profile.id);
  }

  if (input.pic2 instanceof File) {
    pic2Url = await uploadImage(input.pic2, profile.id);
  }

  if (input.pic3 instanceof File) {
    pic3Url = await uploadImage(input.pic3, profile.id);
  }

  const { data, error } = await supabase
    .from("social_projects")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status,
      contact_phone: input.contact_phone.trim(),
      address: input.address.trim() || null,
      pix_key: input.pix_key.trim() || null,
      volunteer_info: input.volunteer_info.trim() || null,
      pic_1_url: pic1Url,
      pic_2_url: pic2Url,
      pic_3_url: pic3Url,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SocialProjectItem;
}

export async function deleteSocialProjectItem(id: string) {
  const profile = await getCurrentProfile();
  ensureCanManage(profile.role);

  const current = await getSocialProjectItemById(id);

  if (
    profile.role !== "admin" &&
    current.community.toLowerCase() !== String(profile.comunity).toLowerCase()
  ) {
    throw new Error("Você não pode excluir projetos de outra comunidade.");
  }

  const { error } = await supabase
    .from("social_projects")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
