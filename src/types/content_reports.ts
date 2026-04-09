export type ReportableContentType =
  | "lost_animals"
  | "lost_and_found"
  | "home_rent";

export type ContentReportReason =
  | "child_safety"
  | "sexual_content_minor"
  | "violence"
  | "fraud"
  | "spam"
  | "privacy"
  | "other";

export type SubmitContentReportResult = {
  report_id: string;
  created: boolean;
};

export type ReportTarget = {
  contentType: ReportableContentType;
  contentId: string;
  contentLabel: string;
};

export const CONTENT_REPORT_REASON_LABELS: Record<ContentReportReason, string> =
  {
    child_safety: "Segurança infantil",
    sexual_content_minor: "Conteúdo sexual",
    violence: "Violência, ameaça ou coação",
    fraud: "Golpe, fraude ou enganoso",
    spam: "Spam, duplicado ou abuso",
    privacy: "Exposição de dados",
    other: "Outro motivo",
  };

export const REPORTABLE_CONTENT_TYPE_LABELS: Record<
  ReportableContentType,
  string
> = {
  lost_animals: "Animais perdidos/achados",
  lost_and_found: "Achados e perdidos",
  home_rent: "Moradia",
};
