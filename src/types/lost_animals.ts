export type LostAnimalsItem = {
  id: string;
  name: string;
  community: string;
  description: string;
  type: "lost" | "found";
  status: "open" | "resolved";
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
  type: "lost" | "found";
  phone: string;
  pic1: File;
  pic2: File | null;
  pic3: File | null;
};
