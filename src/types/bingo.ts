export type BingoStatus = "active" | "archived";

export type BingoGame = {
  id: string;
  community: string;
  title: string;
  scheduled_at: string;
  status: BingoStatus;
  drawn_numbers: number[];
  current_number: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  numbers_remaining: number;
  can_draw: boolean;
};

export type BingoCard = {
  id: string;
  bingo_id: string;
  user_id: string;
  community: string;
  numbers: (number | null)[];
  marked_numbers: number[];
  rerolled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateBingoInput = {
  title: string;
  scheduled_at: string;
};

export type BingoPublicData = {
  bingos: BingoGame[];
  cards: BingoCard[];
  associationLogoUrl: string | null;
};
