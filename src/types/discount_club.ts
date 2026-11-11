export type DiscountStore = {
  id: string;
  api_store_id: string;
  name: string;
  niche: string | null;
  community: string;
  photo_url: string | null;
  whatsapp: string | null;
  premium: boolean;
  discount_percent: number;
  status: "active" | "inactive";
  source_data: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type StoreCatalogItem = {
  id: string;
  name: string;
  niche: string | null;
  community: string | null;
  photoUrl: string | null;
  whatsapp: string | null;
  premium: boolean;
  sourceData: Record<string, unknown>;
};
