export type WarningBanner = {
  id: string;
  community: string;
  message: string;
  text_color: string;
  background_image_url: string | null;
  status: "active" | "inactive";
  created_by: string;
  expires_at: string;
  created_at: string;
  updated_at?: string | null;
};

export type CreateWarningBannerInput = {
  message: string;
  text_color: string;
  expires_at: string;
};

export type UpdateWarningBannerInput = {
  message: string;
  text_color: string;
  expires_at: string;
};
