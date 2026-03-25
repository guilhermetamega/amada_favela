export type LostAndFoundType = "lost" | "found";
export type LostAndFoundStatus = "open" | "resolved";

export type LostAndFoundItem = {
  id: string;
  title: string;
  community: string;
  description: string;
  type: LostAndFoundType;
  status: LostAndFoundStatus;
  pic_1_url: string;
  pic_2_url: string | null;
  pic_3_url: string | null;
  phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateLostAndFoundInput = {
  title: string;
  community: string;
  description: string;
  type: LostAndFoundType;
  phone: string;
  pic1: File;
  pic2: File | null;
  pic3: File | null;
};

export type LostAndFoundState = {
  items: LostAndFoundItem[];
  loadedAt: number | null;
};

export type LostAndFoundFiltersState = {
  search: string;
  type: "all" | LostAndFoundType;
  status: "all" | LostAndFoundStatus;
};
