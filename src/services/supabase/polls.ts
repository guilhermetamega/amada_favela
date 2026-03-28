import { supabase } from "@/services/supabase/client";
import type {
  CreatePollInput,
  Poll,
  PollOption,
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

type PollRow = {
  id: string;
  community: string;
  title: string;
  description: string | null;
  status: "active" | "archived";
  created_by: string;
  voting_ends_at: string;
  visible_until: string;
  created_at: string;
  updated_at: string;
};

type PollOptionRow = {
  id: string;
  poll_id: string;
  label: string;
  position: number;
};

type PollVoteRow = {
  poll_id: string;
  option_id: string;
  user_id: string;
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

function mapPolls(
  polls: PollRow[],
  options: PollOptionRow[],
  votes: PollVoteRow[],
  currentUserId: string,
) {
  return polls.map((poll): Poll => {
    const pollOptions = options
      .filter((option) => option.poll_id === poll.id)
      .sort((a, b) => a.position - b.position);

    const pollVotes = votes.filter((vote) => vote.poll_id === poll.id);
    const totalVotes = pollVotes.length;
    const userVote = pollVotes.find((vote) => vote.user_id === currentUserId);

    const mappedOptions: PollOption[] = pollOptions.map((option) => {
      const votesCount = pollVotes.filter(
        (vote) => vote.option_id === option.id,
      ).length;

      return {
        ...option,
        votes_count: votesCount,
        percentage:
          totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0,
      };
    });

    const now = new Date();

    return {
      ...poll,
      options: mappedOptions,
      total_votes: totalVotes,
      has_voted: !!userVote,
      user_vote_option_id: userVote?.option_id ?? null,
      voting_open:
        new Date(poll.voting_ends_at) >= now && poll.status === "active",
      visible_now: new Date(poll.visible_until) >= now,
    };
  });
}

async function fetchPollsBase() {
  const profile = await getCurrentProfile();

  const { data: pollsData, error: pollsError } = await supabase
    .from("polls")
    .select("*")
    .eq("community", profile.comunity)
    .gte("visible_until", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (pollsError) throw new Error(pollsError.message);

  const polls = (pollsData ?? []) as PollRow[];

  if (polls.length === 0) {
    return {
      profile,
      polls: [],
      options: [],
      votes: [],
    };
  }

  const pollIds = polls.map((poll) => poll.id);

  const [
    { data: optionsData, error: optionsError },
    { data: votesData, error: votesError },
  ] = await Promise.all([
    supabase
      .from("poll_options")
      .select("*")
      .in("poll_id", pollIds)
      .order("position", { ascending: true }),
    supabase
      .from("poll_votes")
      .select("poll_id, option_id, user_id")
      .in("poll_id", pollIds),
  ]);

  if (optionsError) throw new Error(optionsError.message);
  if (votesError) throw new Error(votesError.message);

  return {
    profile,
    polls,
    options: (optionsData ?? []) as PollOptionRow[],
    votes: (votesData ?? []) as PollVoteRow[],
  };
}

export async function getVisiblePolls() {
  const cached = readPollsCache();
  if (cached) return cached;

  const { profile, polls, options, votes } = await fetchPollsBase();
  const mapped = mapPolls(polls, options, votes, profile.id);
  writePollsCache(mapped);
  return mapped;
}

export async function getManageablePolls() {
  const cached = readAdminPollsCache();
  if (cached) return cached;

  const profile = await getCurrentProfile();

  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { profile: actor, polls, options, votes } = await fetchPollsBase();
  const mapped = mapPolls(polls, options, votes, actor.id);
  writeAdminPollsCache(mapped);
  return mapped;
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
