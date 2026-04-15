export type SponsorStoreBanner = {
  id: string;
  sponsor_id: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

export type SponsorStoreBannerFeatureOption = {
  key: string;
  label: string;
  description: string | null;
  icon: string | null;
  route: string | null;
  sort_order?: number;
};

export type SponsorStoreBannerGetResponse = {
  ok: boolean;
  item?: SponsorStoreBanner | null;
  selectedFeatureKeys?: string[];
  availableFeatures?: SponsorStoreBannerFeatureOption[];
  message?: string;
};

export type SponsorStoreBannerSaveResponse = {
  ok: boolean;
  item?: SponsorStoreBanner | null;
  selectedFeatureKeys?: string[];
  message?: string;
};

export type SponsorStoreBannerDeleteResponse = {
  ok: boolean;
  deleted?: boolean;
  message?: string;
};
