import {
  invalidateBingoCache,
  readAdminBingoCache,
  readPublicBingoCache,
  writeAdminBingoCache,
  writePublicBingoCache,
} from "@/lib/cache/bingo";
import { getCommunityDataByCommunity, getCommunityImageSignedUrl } from "@/services/supabase/community_data";
import { supabase } from "@/services/supabase/client";
import type {
  BingoCard,
  BingoGame,
  BingoPublicData,
  CreateBingoInput,
} from "@/types/bingo";

type ProfileRow = {
  id: string;
  role: string;
  comunity: string | null;
};

type BingoRow = {
  id: string;
  community: string;
  title: string;
  scheduled_at: string;
  status: "active" | "archived";
  drawn_numbers: number[] | null;
  current_number: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type BingoCardRow = {
  id: string;
  bingo_id: string;
  user_id: string;
  community: string;
  numbers: (number | null)[] | null;
  marked_numbers: number[] | null;
  rerolled_at: string | null;
  created_at: string;
  updated_at: string;
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

function ensureCommunity(profile: ProfileRow) {
  const community = profile.comunity?.trim();
  if (!community) throw new Error("Seu perfil não possui comunidade definida.");
  return community;
}

function ensureCanManage(profile: ProfileRow) {
  if (!["employee", "president", "admin"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }
}

function normalizeNumberList(value: number[] | null | undefined) {
  return Array.isArray(value) ? value.filter(Number.isFinite) : [];
}

function mapBingo(row: BingoRow): BingoGame {
  const drawnNumbers = normalizeNumberList(row.drawn_numbers);

  return {
    ...row,
    drawn_numbers: drawnNumbers,
    current_number: row.current_number,
    numbers_remaining: Math.max(75 - drawnNumbers.length, 0),
    can_draw: row.status === "active" && drawnNumbers.length < 75,
  };
}

function mapCard(row: BingoCardRow): BingoCard {
  return {
    ...row,
    numbers: Array.isArray(row.numbers) ? row.numbers : [],
    marked_numbers: normalizeNumberList(row.marked_numbers),
  };
}

async function getAssociationLogoUrl(community: string) {
  try {
    const communityData = await getCommunityDataByCommunity(community);
    if (!communityData?.picture_path) return null;
    return await getCommunityImageSignedUrl(communityData.picture_path);
  } catch {
    return null;
  }
}

export async function getManageableBingos() {
  const cached = readAdminBingoCache();
  if (cached) return cached;

  const profile = await getCurrentProfile();
  ensureCanManage(profile);
  const community = ensureCommunity(profile);

  const { data, error } = await supabase
    .from("bingos")
    .select("*")
    .eq("community", community)
    .order("scheduled_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  const mapped = ((data ?? []) as BingoRow[]).map(mapBingo);
  writeAdminBingoCache(mapped);
  return mapped;
}

export async function getVisibleBingos(): Promise<BingoPublicData> {
  const cached = readPublicBingoCache();
  if (cached) return cached;

  const profile = await getCurrentProfile();
  const community = ensureCommunity(profile);

  const { data: bingosData, error: bingosError } = await supabase
    .from("bingos")
    .select("*")
    .eq("community", community)
    .eq("status", "active")
    .order("scheduled_at", { ascending: false })
    .limit(10);

  if (bingosError) throw new Error(bingosError.message);

  const bingos = ((bingosData ?? []) as BingoRow[]).map(mapBingo);
  let cards: BingoCard[] = [];

  if (bingos.length > 0) {
    const bingoIds = bingos.map((bingo) => bingo.id);
    const { data: cardsData, error: cardsError } = await supabase
      .from("bingo_cards")
      .select("*")
      .eq("user_id", profile.id)
      .in("bingo_id", bingoIds);

    if (cardsError) throw new Error(cardsError.message);
    cards = ((cardsData ?? []) as BingoCardRow[]).map(mapCard);
  }

  const associationLogoUrl = await getAssociationLogoUrl(community);
  const payload = { bingos, cards, associationLogoUrl };
  writePublicBingoCache(payload);
  return payload;
}

export async function createBingo(input: CreateBingoInput) {
  const profile = await getCurrentProfile();
  ensureCanManage(profile);

  const { data, error } = await supabase.rpc("create_bingo", {
    input_title: input.title.trim(),
    input_scheduled_at: input.scheduled_at,
  });

  if (error) throw new Error(error.message);

  invalidateBingoCache();
  return data as string;
}

export async function drawBingoNumber(bingoId: string) {
  const profile = await getCurrentProfile();
  ensureCanManage(profile);

  const { data, error } = await supabase.rpc("draw_bingo_number", {
    input_bingo_id: bingoId,
  });

  if (error) throw new Error(error.message);

  invalidateBingoCache();
  return mapBingo(data as BingoRow);
}

export async function getOrCreateBingoCard(bingoId: string) {
  const { data, error } = await supabase.rpc("get_or_create_bingo_card", {
    input_bingo_id: bingoId,
  });

  if (error) throw new Error(error.message);

  invalidateBingoCache();
  return mapCard(data as BingoCardRow);
}

export async function rerollBingoCard(bingoId: string) {
  const { data, error } = await supabase.rpc("reroll_bingo_card", {
    input_bingo_id: bingoId,
  });

  if (error) throw new Error(error.message);

  invalidateBingoCache();
  return mapCard(data as BingoCardRow);
}

export async function updateBingoCardMarks(
  cardId: string,
  markedNumbers: number[],
) {
  const cleanNumbers = Array.from(
    new Set(markedNumbers.filter((number) => number >= 1 && number <= 75)),
  );

  const { data, error } = await supabase
    .from("bingo_cards")
    .update({ marked_numbers: cleanNumbers })
    .eq("id", cardId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  invalidateBingoCache();
  return mapCard(data as BingoCardRow);
}
