export type SocialProjectItem = {
  id: string;
  title: string;
  community: string;
  description: string;
  status: "active" | "inactive";
  contact_phone: string;
  address: string | null;
  pix_key: string | null;
  volunteer_info: string | null;
  pic_1_url: string;
  pic_2_url: string | null;
  pic_3_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateSocialProjectInput = {
  title: string;
  description: string;
  contact_phone: string;
  address: string;
  pix_key: string;
  volunteer_info: string;
  status: "active" | "inactive";
  pic1: File;
  pic2: File | null;
  pic3: File | null;
};

export type UpdateSocialProjectInput = {
  title: string;
  description: string;
  contact_phone: string;
  address: string;
  pix_key: string;
  volunteer_info: string;
  status: "active" | "inactive";
  pic1?: File | null;
  pic2?: File | null;
  pic3?: File | null;
};
