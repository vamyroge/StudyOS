export type AIIntent =
  | "explain_concept"
  | "solve_problem"
  | "practice"
  | "review"
  | "diagnose"
  | "plan"
  | "analyze_error"
  | "general_question"
  | "unknown";

export type AIRole =
  | "tutor"
  | "examiner"
  | "coach"
  | "reviewer"
  | "mentor"
  | "problem_solver"
  | "research_assistant";

export interface OrchestratorContext {
  studentId?: string;
  intent: AIIntent;
  role: AIRole;
  privacyAllowed: boolean;
  studentContext?: Record<string, unknown>;
  knowledgeContext?: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface OrchestratorRequest {
  message: string;
  studentId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface OrchestratorResponse {
  content: string;
  role: AIRole;
  intent: AIIntent;
  sources?: Array<{
    documentId: string;
    version?: number;
    page?: number;
    chunk?: string;
    source: string;
  }>;
  confidence: number;
  insufficientEvidence: boolean;
}
