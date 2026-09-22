export type Role = "STUDENT" | "ADMIN";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  grade: number;
  class_name?: string;
  subjects: string[];
  learning_goals?: string;
  target_exam?: string;
  study_preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PrivacySettings {
  id: string;
  student_id: string;
  allow_ai_profile: boolean;
  allow_ai_history: boolean;
  allow_ai_mistakes: boolean;
  allow_ai_mastery: boolean;
  allow_ai_study_sessions: boolean;
  allow_personalization: boolean;
  allow_proactive_recommendations: boolean;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Grade {
  id: string;
  level: number;
  name: string;
}

export interface TextbookSeries {
  id: string;
  subject_id: string;
  name: string;
  publisher: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  textbook_series_id?: string;
  name: string;
  order: number;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  order: number;
}

export interface Concept {
  id: string;
  topic_id: string;
  name: string;
  description?: string;
}

export type ConceptRelationshipType =
  | "PREREQUISITE"
  | "RELATED_TO"
  | "PART_OF"
  | "DEPENDS_ON";

export interface ConceptRelationship {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: ConceptRelationshipType;
  source: string;
  confidence: number;
  status: "pending_review" | "verified" | "rejected";
  created_by?: string;
  version: number;
}

export interface Document {
  id: string;
  title: string;
  subject_id?: string;
  storage_path: string;
  file_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  content_hash: string;
  source: string;
  status: "pending" | "processing" | "ready" | "failed";
  created_at: string;
  created_by: string;
}

export interface DocumentChunk {
  id: string;
  document_version_id: string;
  content: string;
  page_number?: number;
  chunk_index: number;
  metadata: Record<string, unknown>;
}

export interface DocumentEmbedding {
  id: string;
  chunk_id: string;
  embedding: number[];
  embedding_model: string;
  embedding_dimension: number;
  embedding_version: string;
  created_at: string;
}

export interface DocumentProcessingJob {
  id: string;
  document_id: string;
  status: "queued" | "processing" | "retrying" | "completed" | "failed" | "cancelled";
  progress: number;
  retry_count: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export type QuestionType = "multiple_choice" | "true_false" | "fill_blank" | "essay";
export type QuestionStatus = "draft" | "review" | "approved" | "rejected" | "archived";

export interface Question {
  id: string;
  content: string;
  subject_id: string;
  grade_id?: string;
  chapter_id?: string;
  topic_id?: string;
  difficulty: number;
  question_type: QuestionType;
  source?: string;
  source_page?: number;
  estimated_time?: number;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  order: number;
}

export interface Solution {
  id: string;
  question_id: string;
  content: string;
  steps?: string[];
}

export interface QuestionConcept {
  question_id: string;
  concept_id: string;
}

export interface Attempt {
  id: string;
  student_id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  response_time_ms: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type ErrorType =
  | "concept_gap"
  | "calculation_error"
  | "formula_misuse"
  | "misunderstanding"
  | "reasoning_error"
  | "reading_error"
  | "careless_error"
  | "unknown";

export interface Mistake {
  id: string;
  attempt_id: string;
  student_id: string;
  concept_id?: string;
  error_type: ErrorType;
  evidence?: string;
  confidence: number;
  model?: string;
  created_at: string;
}

export interface StudentMastery {
  id: string;
  student_id: string;
  concept_id: string;
  mastery_level: number;
  algorithm_version: string;
  last_assessed_at: string;
}

export interface StudentWeakness {
  id: string;
  student_id: string;
  concept_id: string;
  severity: number;
  identified_at: string;
}

export interface StudyGoal {
  id: string;
  student_id: string;
  title: string;
  target_date?: string;
  completed: boolean;
  created_at: string;
}

export interface StudySession {
  id: string;
  student_id: string;
  subject_id?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
}

export interface LearningRecommendation {
  id: string;
  student_id: string;
  action: string;
  reason: string;
  evidence: string;
  confidence: number;
  created_at: string;
}

export interface ReviewSchedule {
  id: string;
  student_id: string;
  concept_id: string;
  last_review?: string;
  next_review: string;
  interval_days: number;
  difficulty: number;
  review_result?: string;
}

export interface Submission {
  id: string;
  submitter_id: string;
  target_type: string;
  target_id: string;
  status: "pending" | "processing" | "flagged" | "approved" | "rejected" | "archived";
  source?: string;
  version: number;
  created_at: string;
}

export interface ModerationReview {
  id: string;
  submission_id: string;
  reviewer_id: string;
  review_reason: string;
  decision: "approved" | "rejected" | "flagged";
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: Role;
  action: string;
  target_type: string;
  target_id: string;
  old_state?: Record<string, unknown>;
  new_state?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  session_id?: string;
  provider: string;
  model: string;
  request_type: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number;
  estimated_cost?: number;
  status: "success" | "error";
  error?: string;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  version: number;
  updated_at: string;
}

export interface Experiment {
  id: string;
  name: string;
  version: number;
  algorithm_version?: string;
  model_version?: string;
  prompt_version?: string;
  question_set_version?: string;
  description?: string;
  created_at: string;
}

export interface ExperimentParticipant {
  experiment_id: string;
  research_participant_id: string;
  condition: string;
  joined_at: string;
}

export interface EvaluationRun {
  id: string;
  name: string;
  evaluation_type: string;
  model_version?: string;
  algorithm_version?: string;
  created_at: string;
}

export interface EvaluationCase {
  id: string;
  run_id: string;
  question: string;
  expected_sources?: string[];
  expected_answer?: string;
  retrieved_sources?: string[];
  generated_answer?: string;
  metrics?: Record<string, number>;
}
