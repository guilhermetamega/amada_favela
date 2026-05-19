import type { ResumeBuilderFormData } from "@/types/resume_builder";

export type UpdateResumeField = <FieldName extends keyof ResumeBuilderFormData>(
  field: FieldName,
  value: ResumeBuilderFormData[FieldName],
) => void;
