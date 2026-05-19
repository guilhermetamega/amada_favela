import type { ProfileUser } from "@/types/profile";

export type ResumeTemplateId = "classic" | "modern" | "compact";

export type ResumeTimelineItem = {
  id: string;
  institution: string;
  role: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  activities: string;
};

export type ResumeSkillItem = {
  id: string;
  name: string;
};

export type ResumeBuilderFormData = {
  templateId: ResumeTemplateId;
  email: string;
  linkedin: string;
  lattes: string;
  professionalTitle: string;
  summary: string;
  experiences: ResumeTimelineItem[];
  education: ResumeTimelineItem[];
  skills: ResumeSkillItem[];
  additionalInfo: string;
};

export type ResumeProfileData = Pick<
  ProfileUser,
  "id" | "fullname" | "comunity" | "email" | "phone"
>;

export type AssociationAddressData = {
  associationName: string;
  address: string;
};

export type ResumeBuilderCachePayload = {
  userId: string;
  data: ResumeBuilderFormData;
  updatedAt: string;
};
