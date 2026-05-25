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

export type RaffleWinner = {
  buyer_name: string;
  buyer_instagram: string | null;
  buyer_phone: string;
  buyer_email: string;
  ticket_number: number;
};

export type RaffleDailyRevenue = {
  day: string;
  amount_cents: number;
};

export type SponsorRaffleInsights = {
  raffle: SponsorRaffle;
  total_raised_cents: number;
  daily_revenue: RaffleDailyRevenue[];
  winner: RaffleWinner | null;
};

export type RafflePhoneLookupResult = {
  phone: string;
  total_tickets: number;
  ticket_numbers: number[];
};

export type CreateRaffleInput = {
  title: string;
  description: string;
  salesEndAt: string;
  totalNumbers: number;
  numberPriceCents: number;
  images: File[];
};
