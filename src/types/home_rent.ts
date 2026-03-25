export type HomeRentType = "sell" | "rent";
export type HomeRentStatus = "open" | "closed";

export type HomeRentItem = {
  id: string;
  title: string;
  community: string;
  description: string;
  type: HomeRentType;
  address: string;
  status: HomeRentStatus;
  pic_1_url: string;
  pic_2_url: string | null;
  pic_3_url: string | null;
  phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateHomeRentInput = {
  title: string;
  community: string;
  description: string;
  type: HomeRentType;
  address: string;
  phone: string;
  pic1: File;
  pic2: File | null;
  pic3: File | null;
};

export type HomeRentState = {
  items: HomeRentItem[];
  loadedAt: number | null;
};

export type HomeRentFiltersState = {
  search: string;
  type: "all" | HomeRentType;
  status: "all" | HomeRentStatus;
};

export type HomeRentStatsData = {
  total: number;
  open: number;
  closed: number;
  sell: number;
  rent: number;
};
