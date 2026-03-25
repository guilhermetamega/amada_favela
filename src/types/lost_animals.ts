export type LostAnimalsType = "lost" | "found";
export type LostAnimalsStatus = "open" | "resolved";

export type LostAnimalsItem = {
  id: string;
  name: string;
  community: string;
  description: string;
  type: LostAnimalsType;
  status: LostAnimalsStatus;
  pic_1_url: string;
  pic_2_url: string | null;
  pic_3_url: string | null;
  phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateLostAnimalsInput = {
  name: string;
  community: string;
  description: string;
  type: LostAnimalsType;
  phone: string;
  pic1: File;
  pic2: File | null;
  pic3: File | null;
};

export type LostAnimalsState = {
  items: LostAnimalsItem[];
  loadedAt: number | null;
};

export type LostAnimalsFiltersState = {
  search: string;
  type: "all" | LostAnimalsType;
  status: "all" | LostAnimalsStatus;
};
