import type { ProfileUser } from "@/types/profile";

export type ResumeTemplateId = "classic" | "modern" | "compact";

export type ResumeBuilderFormData = {
  templateId: ResumeTemplateId;
  email: string;
  professionalTitle: string;
  summary: string;
  education: string;
  experience: string;
  skills: string;
  extra: string;
};

export type ResumeProfileData = Pick<
  ProfileUser,
  | "id"
  | "fullname"
  | "address_1"
  | "address_number"
  | "address_2"
  | "comunity"
  | "email"
  | "phone"
>;

export type ResumeBuilderCachePayload = {
  userId: string;
  data: ResumeBuilderFormData;
  updatedAt: string;
};
