export type AIIntent =
  | "question_answer"
  | "explanation"
  | "problem_solving"
  | "concept_learning"
  | "summary"
  | "quiz_request"
  | "practice_request"
  | "homework_help"
  | "exam_preparation"
  | "mistake_analysis"
  | "study_plan"
  | "casual_learning"
  | "unclear";

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
