import { supabase } from "@/services/supabase/client";
import type {
  CreateGarbageCollectionScheduleInput,
  GarbageCollectionSchedule,
  UpdateGarbageCollectionScheduleInput,
} from "@/types/garbage_collection";

async function getCurrentProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("users")
    .select("id, role, comunity")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function getCommunityGarbageSchedules() {
  const profile = await getCurrentProfile();

  const { data, error } = await supabase
    .from("garbage_collection_schedules")
    .select("*")
    .eq("community", profile.comunity)
    .eq("is_active", true)
    .order("weekday", { ascending: true })
    .order("pass_time", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as GarbageCollectionSchedule[];
}

export async function getEditableGarbageSchedules() {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("garbage_collection_schedules")
    .select("*")
    .eq("community", profile.comunity)
    .order("weekday", { ascending: true })
    .order("pass_time", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as GarbageCollectionSchedule[];
}

export async function createGarbageSchedule(
  input: CreateGarbageCollectionScheduleInput,
) {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("garbage_collection_schedules")
    .insert({
      community: profile.comunity,
      weekday: input.weekday,
      pass_time: input.pass_time,
      notes: input.notes?.trim() || null,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as GarbageCollectionSchedule;
}

export async function updateGarbageSchedule(
  id: string,
  input: UpdateGarbageCollectionScheduleInput,
) {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("garbage_collection_schedules")
    .update({
      weekday: input.weekday,
      pass_time: input.pass_time,
      is_active: input.is_active,
      notes: input.notes?.trim() || null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("community", profile.comunity)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as GarbageCollectionSchedule;
}

export async function deleteGarbageSchedule(id: string) {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { error } = await supabase
    .from("garbage_collection_schedules")
    .delete()
    .eq("id", id)
    .eq("community", profile.comunity);

  if (error) throw new Error(error.message);
}
