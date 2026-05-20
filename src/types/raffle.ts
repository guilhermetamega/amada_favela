export type RaffleStatus = "draft" | "active" | "closed";

export type SponsorRaffle = {
  id: string;
  sponsor_id: string;
  slug: string;
  title: string;
  description: string;
  sales_end_at: string;
  total_numbers: number;
  number_price_cents: number;
  status: RaffleStatus;
  winning_number: number | null;
  created_at: string;
  updated_at: string;
  images: string[];
};

export type RafflePublicDetails = SponsorRaffle & {
  sold_numbers: number[];
};

export type CreateRaffleInput = {
  title: string;
  description: string;
  salesEndAt: string;
  totalNumbers: number;
  numberPriceCents: number;
  images: File[];
};
