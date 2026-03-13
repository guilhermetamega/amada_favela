export type HomeRentItem = {
  id: string;
  title: string;
  community: string;
  description: string;
  type: "sell" | "rent";
  address: string;
  status: "open" | "closed";
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
  type: "sell" | "rent";
  address: string;
  phone: string;
  pic1: File;
  pic2: File | null;
  pic3: File | null;
};
