import type { AIIntent, AIRole } from "./types";

const intentToRoleMap: Record<AIIntent, AIRole> = {
  question_answer: "tutor",
  explanation: "tutor",
  problem_solving: "problem_solver",
  concept_learning: "tutor",
  summary: "reviewer",
  quiz_request: "examiner",
  practice_request: "examiner",
  homework_help: "tutor",
  exam_preparation: "coach",
  mistake_analysis: "reviewer",
  study_plan: "coach",
  casual_learning: "mentor",
  unclear: "tutor",
};

export function routeRole(intent: AIIntent): AIRole {
  return intentToRoleMap[intent] || "tutor";
}
