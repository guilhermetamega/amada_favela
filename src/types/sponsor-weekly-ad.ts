export type SponsorWeeklyAd = {
  id: string;
  sponsor_id: string;
  store_name: string;
  phone: string;
  image_primary_url: string;
  image_secondary_url: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
};

export type SponsorWeeklyAdResponse = {
  ok: boolean;
  item?: SponsorWeeklyAd | null;
  deleted?: boolean;
  message?: string;
};
