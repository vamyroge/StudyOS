import type { OrchestratorContext, AIIntent, AIRole } from "./types";
import type { PrivacyCheckResult } from "./privacy";

export function buildContext(params: {
  studentId?: string;
  intent: AIIntent;
  role: AIRole;
  privacy: PrivacyCheckResult;
  studentData?: Record<string, unknown>;
}): OrchestratorContext {
  const filteredContext: Record<string, unknown> = {};

  if (params.privacy.allowed && params.studentData) {
    for (const field of params.privacy.allowedFields) {
      if (params.studentData[field] !== undefined) {
        filteredContext[field] = params.studentData[field];
      }
    }
  }

  return {
    studentId: params.studentId,
    intent: params.intent,
    role: params.role,
    privacyAllowed: params.privacy.allowed,
    studentContext: Object.keys(filteredContext).length > 0 ? filteredContext : undefined,
  };
}
