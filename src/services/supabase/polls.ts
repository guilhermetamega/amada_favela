import { supabase } from "@/services/supabase/client";
import type {
  CreatePollInput,
  Poll,
  UpdatePollInput,
} from "@/types/polls";
import {
  invalidatePollsCache,
  readAdminPollsCache,
  readPollsCache,
  writeAdminPollsCache,
  writePollsCache,
} from "@/lib/cache/polls";

type ProfileRow = {
  id: string;
  role: string;
  comunity: string;
};

async function getCurrentProfile(): Promise<ProfileRow> {
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

  if (error || !data) {
    throw new Error("Não foi possível carregar o perfil do usuário.");
  }

  return data as ProfileRow;
}

async function getCurrentUserId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw new Error(error.message);
  if (!session?.user) throw new Error("Usuário não autenticado.");

  return session.user.id;
}

async function fetchPollsWithResults(manageable: boolean) {
  const { data, error } = await supabase.rpc("get_polls_with_results", {
    input_manageable: manageable,
  });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) return [];

  return data as Poll[];
}

export async function getVisiblePolls() {
  const userId = await getCurrentUserId();
  const cached = readPollsCache(userId);
  if (cached) return cached;

  const polls = await fetchPollsWithResults(false);
  writePollsCache(userId, polls);
  return polls;
}

export async function getManageablePolls() {
  const userId = await getCurrentUserId();
  const cached = readAdminPollsCache(userId);
  if (cached) return cached;

  const polls = await fetchPollsWithResults(true);
  writeAdminPollsCache(userId, polls);
  return polls;
}

export async function createPoll(input: CreatePollInput) {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const cleanOptions = input.options.map((item) => item.trim()).filter(Boolean);

  const { data, error } = await supabase.rpc("create_poll_with_options", {
    input_title: input.title.trim(),
    input_description: input.description.trim(),
    input_voting_ends_at: input.voting_ends_at,
    input_visible_until: input.visible_until,
    input_options: cleanOptions,
  });

  if (error) throw new Error(error.message);

  invalidatePollsCache();
  return data as string;
}

export async function updatePoll(input: UpdatePollInput) {
  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const cleanOptions = input.options.map((item) => item.trim()).filter(Boolean);

  const { error } = await supabase.rpc("update_poll_with_options", {
    input_poll_id: input.pollId,
    input_title: input.title.trim(),
    input_description: input.description.trim(),
    input_voting_ends_at: input.voting_ends_at,
    input_visible_until: input.visible_until,
    input_status: input.status,
    input_options: cleanOptions,
  });

  if (error) throw new Error(error.message);

  invalidatePollsCache();
}

export async function voteOnPoll(pollId: string, optionId: string) {
  const profile = await getCurrentProfile();

  const { error } = await supabase.from("poll_votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: profile.id,
    community: profile.comunity,
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      throw new Error("Você já votou nesta enquete.");
    }

    throw new Error(error.message);
  }

  invalidatePollsCache();
}
