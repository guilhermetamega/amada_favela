import { supabase } from "@/services/supabase/client";
import type {
  ContentReportReason,
  ReportableContentType,
  SubmitContentReportResult,
} from "@/types/content_reports";

type SubmitContentReportInput = {
  contentType?: ReportableContentType;
  contentId?: string;
  reason: ContentReportReason;
  details?: string;
};

export async function submitContentReport(input: SubmitContentReportInput) {
  const { data, error } = await supabase.rpc("submit_content_report", {
    p_content_type: input.contentType,
    p_content_id: input.contentId,
    p_reason: input.reason,
    p_details: input.details?.trim() || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = Array.isArray(data) ? data[0] : data;

  return result as SubmitContentReportResult;
}

export async function getMyReportedContentIds(
  contentType: ReportableContentType,
  contentIds: string[],
) {
  if (!contentIds.length) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("content_reports")
    .select("content_id,status")
    .eq("content_type", contentType)
    .in("content_id", contentIds)
    .in("status", ["pending", "under_review"]);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((item) => item.content_id as string));
}
