import type { PrivacySettings } from "@/types";

export interface PrivacyCheckResult {
  allowed: boolean;
  allowedFields: string[];
}

const DEFAULT_PRIVACY: PrivacySettings = {
  id: "",
  student_id: "",
  allow_ai_profile: true,
  allow_ai_history: true,
  allow_ai_mistakes: true,
  allow_ai_mastery: true,
  allow_ai_study_sessions: true,
  allow_personalization: true,
  allow_proactive_recommendations: false,
  updated_at: "",
};

export function checkPrivacy(
  settings?: PrivacySettings | null
): PrivacyCheckResult {
  const privacy = settings || DEFAULT_PRIVACY;
  const allowedFields: string[] = [];

  if (privacy.allow_ai_profile) allowedFields.push("profile");
  if (privacy.allow_ai_history) allowedFields.push("history");
  if (privacy.allow_ai_mistakes) allowedFields.push("mistakes");
  if (privacy.allow_ai_mastery) allowedFields.push("mastery");
  if (privacy.allow_ai_study_sessions) allowedFields.push("sessions");

  return {
    allowed: privacy.allow_personalization,
    allowedFields,
  };
}
