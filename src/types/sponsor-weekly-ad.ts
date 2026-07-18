export type SponsorWeeklyAd = {
  id: string;
  sponsor_id: string;
  community: string;
  store_name: string;
  phone: string;
  image_primary_url: string;
  image_secondary_url: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
};

export type SponsorAdCommunityOption = {
  key: string;
  label: string;
};

export type SponsorWeeklyAdResponse = {
  ok: boolean;
  item?: SponsorWeeklyAd | null;
  availableCommunities?: SponsorAdCommunityOption[];
  defaultCommunity?: string | null;
  deleted?: boolean;
  message?: string;
};
