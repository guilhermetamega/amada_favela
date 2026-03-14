export type WarningBanner = {
  id: string;
  community: string;
  message: string;
  text_color: string;
  background_image_url: string;
  status: "active" | "inactive";
  created_by: string;
  created_at: string;
  expires_at: string;
};

export type CreateWarningBannerInput = {
  message: string;
  text_color: string;
  expires_at: string;
};
