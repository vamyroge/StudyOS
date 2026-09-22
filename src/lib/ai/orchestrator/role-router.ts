import type { AIIntent, AIRole } from "./types";

const INTENT_ROLE_MAP: Record<AIIntent, AIRole> = {
  explain_concept: "tutor",
  solve_problem: "problem_solver",
  practice: "examiner",
  review: "reviewer",
  diagnose: "reviewer",
  plan: "coach",
  analyze_error: "reviewer",
  general_question: "tutor",
  unknown: "tutor",
};

export function routeRole(intent: AIIntent): AIRole {
  return INTENT_ROLE_MAP[intent] || "tutor";
}
