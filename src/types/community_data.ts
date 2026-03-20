export type CommunityData = {
  id: string;
  picture_path: string;
  community: string;
  description: string | null;
  created_at: string;
};

export type CommunityProfile = {
  id: string;
  role: "admin" | "president" | "employee" | "user";
  comunity: string | null;
};

export type UpsertCommunityDataInput = {
  description: string;
  pictureFile?: File | null;
};
