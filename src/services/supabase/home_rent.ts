import { supabase } from "@/services/supabase/client";
import type { CreateHomeRentInput, HomeRentItem } from "@/types/home_rent";

const BUCKET_NAME = "home_rent";

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

export async function getHomeRentItems() {
  const { data, error } = await supabase
    .from("home_rent")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as HomeRentItem[];
}

export async function getHomeRentItemById(id: string) {
  const { data, error } = await supabase
    .from("home_rent")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as HomeRentItem;
}

export async function createHomeRentItem(input: CreateHomeRentInput) {
  const {
    title,
    community,
    description,
    type,
    address,
    phone,
    pic1,
    pic2,
    pic3,
  } = input;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const pic1Url = await uploadImage(pic1, user.id);
  const pic2Url = pic2 ? await uploadImage(pic2, user.id) : null;
  const pic3Url = pic3 ? await uploadImage(pic3, user.id) : null;

  const { data, error } = await supabase
    .from("home_rent")
    .insert({
      title: title.trim(),
      community: community.trim(),
      description: description.trim(),
      type,
      address,
      status: "open",
      pic_1_url: pic1Url,
      pic_2_url: pic2Url,
      pic_3_url: pic3Url,
      phone: phone.trim(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as HomeRentItem;
}
