"use server";

import { requireRole } from "@/lib/auth/utils";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/logger";
import { revalidatePath } from "next/cache";

export async function moderateSubmission(formData: FormData) {
  const { user, profile } = await requireRole(["ADMIN"]);
  const submissionId = formData.get("submissionId") as string;
  const decision = formData.get("decision") as "approved" | "rejected" | "flagged";

  if (!submissionId || !decision) {
    return { error: "Missing required fields" };
  }

  const supabase = await createAdminClient();

  // Get submission
  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (!submission) {
    return { error: "Submission not found" };
  }

  // Create moderation review
  const { error: reviewError } = await supabase.from("moderation_reviews").insert({
    submission_id: submissionId,
    reviewer_id: user.id,
    decision,
    review_reason: `Moderated by ${profile.username}`,
  });

  if (reviewError) {
    return { error: "Failed to create review" };
  }

  // Update submission status
  const newStatus = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "flagged";
  const { error: updateError } = await supabase
    .from("submissions")
    .update({ status: newStatus })
    .eq("id", submissionId);

  if (updateError) {
    return { error: "Failed to update submission" };
  }

  // Log audit
  await logAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: "moderate_submission",
    targetType: "submission",
    targetId: submissionId,
    metadata: { decision, previousStatus: submission.status },
  });

  revalidatePath("/admin/moderation");
  return { success: true };
}
