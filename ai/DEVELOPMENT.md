# Database Schema

## Status: PARTIALLY INTEGRATED / DATABASE VERIFICATION BLOCKED

Migrations `001` through `007` define the schema, RLS hardening, Storage bucket policy, vector retrieval RPC, and data-integrity constraints. The actual target database state is not verified because `DATABASE_URL` is not configured locally.

## Entity Relationship Overview

### Users & Auth
```
auth.users (Supabase Auth)
  ↓ trigger on insert
profiles
  ├── id (uuid, PK, references auth.users)
  ├── username (varchar, UNIQUE, NOT NULL)
  ├── display_name (varchar)
  ├── role (enum: STUDENT, ADMIN) DEFAULT 'STUDENT'
  ├── created_at (timestamptz)
  └── updated_at (timestamptz)

student_profiles
  ├── id (uuid, PK)
  ├── user_id (uuid, FK → profiles.id, UNIQUE)
  ├── grade (int, CHECK >= 10 AND <= 12)
  ├── class_name (varchar, nullable)
  ├── subjects (text[])
  ├── learning_goals (text, nullable)
  ├── target_exam (varchar, nullable)
  ├── study_preferences (jsonb, nullable)
  ├── created_at (timestamptz)
  └── updated_at (timestamptz)

privacy_settings
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → student_profiles.id, UNIQUE)
  ├── allow_ai_profile (boolean) DEFAULT true
  ├── allow_ai_history (boolean) DEFAULT true
  ├── allow_ai_mistakes (boolean) DEFAULT true
  ├── allow_ai_mastery (boolean) DEFAULT true
  ├── allow_ai_study_sessions (boolean) DEFAULT true
  ├── allow_personalization (boolean) DEFAULT true
  ├── allow_proactive_recommendations (boolean) DEFAULT false
  └── updated_at (timestamptz)
```

### Curriculum
```
subjects
  ├── id (uuid, PK)
  ├── name (varchar) -- Toán, Vật lý, Hóa học
  ├── slug (varchar, UNIQUE)
  └── description (text, nullable)

grades
  ├── id (uuid, PK)
  ├── level (int, UNIQUE) -- 10, 11, 12
  └── name (varchar)

textbook_series
  ├── id (uuid, PK)
  ├── subject_id (uuid, FK → subjects.id)
  ├── name (varchar)
  └── publisher (varchar)

chapters
  ├── id (uuid, PK)
  ├── subject_id (uuid, FK → subjects.id)
  ├── textbook_series_id (uuid, FK → textbook_series.id, nullable)
  ├── name (varchar)
  └── order (int)

topics
  ├── id (uuid, PK)
  ├── chapter_id (uuid, FK → chapters.id)
  ├── name (varchar)
  └── order (int)

concepts
  ├── id (uuid, PK)
  ├── topic_id (uuid, FK → topics.id)
  ├── name (varchar)
  └── description (text, nullable)

concept_relationships
  ├── id (uuid, PK)
  ├── source_concept_id (uuid, FK → concepts.id)
  ├── target_concept_id (uuid, FK → concepts.id)
  ├── relationship_type (enum: PREREQUISITE, RELATED_TO, PART_OF, DEPENDS_ON)
  ├── source (varchar) -- curriculum_source, ai_generated, manual
  ├── confidence (float, CHECK >= 0 AND <= 1)
  ├── status (enum: pending_review, verified, rejected)
  ├── created_by (uuid, nullable)
  └── version (int) DEFAULT 1
  UNIQUE(source_concept_id, target_concept_id, relationship_type, version)
```

### Knowledge Base
```
documents
  ├── id (uuid, PK)
  ├── title (varchar)
  ├── subject_id (uuid, FK → subjects.id, nullable)
  ├── storage_path (varchar)
  ├── file_type (varchar)
  ├── created_by (uuid, FK → profiles.id)
  ├── created_at (timestamptz)
  └── updated_at (timestamptz)

document_versions
  ├── id (uuid, PK)
  ├── document_id (uuid, FK → documents.id)
  ├── version (int)
  ├── content_hash (varchar)
  ├── source (varchar)
  ├── status (enum: pending, processing, ready, failed)
  ├── created_at (timestamptz)
  └── created_by (uuid, FK → profiles.id)
  UNIQUE(document_id, version)

document_pages
  ├── id (uuid, PK)
  ├── document_version_id (uuid, FK → document_versions.id)
  ├── page_number (int)
  └── content (text)

document_chunks
  ├── id (uuid, PK)
  ├── document_version_id (uuid, FK → document_versions.id)
  ├── content (text)
  ├── page_number (int, nullable)
  ├── chunk_index (int)
  └── metadata (jsonb)

document_embeddings
  ├── id (uuid, PK)
  ├── chunk_id (uuid, FK → document_chunks.id)
  ├── embedding (vector)
  ├── embedding_model (varchar)
  ├── embedding_dimension (int)
  ├── embedding_version (varchar)
  └── created_at (timestamptz)

document_processing_jobs
  ├── id (uuid, PK)
  ├── document_id (uuid, FK → documents.id)
  ├── status (enum: queued, processing, retrying, completed, failed, cancelled)
  ├── progress (float) DEFAULT 0
  ├── retry_count (int) DEFAULT 0
  ├── error_message (text, nullable)
  ├── started_at (timestamptz, nullable)
  ├── completed_at (timestamptz, nullable)
  └── created_at (timestamptz)
```

### Question Bank
```
questions
  ├── id (uuid, PK)
  ├── content (text)
  ├── subject_id (uuid, FK → subjects.id)
  ├── grade_id (uuid, FK → grades.id, nullable)
  ├── chapter_id (uuid, FK → chapters.id, nullable)
  ├── topic_id (uuid, FK → topics.id, nullable)
  ├── difficulty (float, CHECK >= 0 AND <= 1)
  ├── question_type (enum: multiple_choice, true_false, fill_blank, essay)
  ├── source (varchar, nullable)
  ├── source_page (int, nullable)
  ├── estimated_time (int, nullable) -- seconds
  ├── status (enum: draft, review, approved, rejected, archived)
  ├── created_at (timestamptz)
  └── updated_at (timestamptz)

question_options
  ├── id (uuid, PK)
  ├── question_id (uuid, FK → questions.id)
  ├── content (text)
  ├── is_correct (boolean)
  └── order (int)

solutions
  ├── id (uuid, PK)
  ├── question_id (uuid, FK → questions.id)
  ├── content (text)
  └── steps (text[], nullable)

question_concepts
  ├── question_id (uuid, FK → questions.id)
  ├── concept_id (uuid, FK → concepts.id)
  PRIMARY KEY(question_id, concept_id)
```

### Learning Events
```
attempts (IMMUTABLE - never update/delete)
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → profiles.id)
  ├── question_id (uuid, FK → questions.id)
  ├── answer (text)
  ├── is_correct (boolean)
  ├── response_time_ms (int)
  ├── metadata (jsonb, nullable)
  └── created_at (timestamptz)

mistakes
  ├── id (uuid, PK)
  ├── attempt_id (uuid, FK → attempts.id)
  ├── student_id (uuid, FK → profiles.id)
  ├── concept_id (uuid, FK → concepts.id, nullable)
  ├── error_type (enum: concept_gap, calculation_error, formula_misuse, misunderstanding, reasoning_error, reading_error, careless_error, unknown)
  ├── evidence (text, nullable)
  ├── confidence (float, CHECK >= 0 AND <= 1)
  ├── model (varchar, nullable)
  └── created_at (timestamptz)

student_mastery (DERIVED - recomputed from attempts)
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → profiles.id)
  ├── concept_id (uuid, FK → concepts.id)
  ├── mastery_level (float, CHECK >= 0 AND <= 1)
  ├── algorithm_version (varchar)
  └── last_assessed_at (timestamptz)
  UNIQUE(student_id, concept_id)

student_weaknesses (DERIVED)
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → profiles.id)
  ├── concept_id (uuid, FK → concepts.id)
  ├── severity (float)
  └── identified_at (timestamptz)

study_goals
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → profiles.id)
  ├── title (varchar)
  ├── target_date (date, nullable)
  ├── completed (boolean) DEFAULT false
  └── created_at (timestamptz)

study_sessions
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → profiles.id)
  ├── subject_id (uuid, FK → subjects.id, nullable)
  ├── started_at (timestamptz)
  ├── ended_at (timestamptz, nullable)
  └── duration_seconds (int, nullable)

learning_recommendations (DERIVED)
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → profiles.id)
  ├── action (varchar) -- learn_concept, review_concept, easy_question, etc.
  ├── reason (text)
  ├── evidence (text)
  ├── confidence (float)
  └── created_at (timestamptz)

review_schedule
  ├── id (uuid, PK)
  ├── student_id (uuid, FK → profiles.id)
  ├── concept_id (uuid, FK → concepts.id)
  ├── last_review (timestamptz, nullable)
  ├── next_review (timestamptz)
  ├── interval_days (int)
  ├── difficulty (float)
  └── review_result (varchar, nullable)
```

### Admin & Research
```
submissions
  ├── id (uuid, PK)
  ├── submitter_id (uuid, FK → profiles.id)
  ├── target_type (varchar) -- document, question
  ├── target_id (uuid)
  ├── status (enum: pending, processing, flagged, approved, rejected, archived)
  ├── source (varchar, nullable)
  ├── version (int) DEFAULT 1
  └── created_at (timestamptz)

moderation_reviews
  ├── id (uuid, PK)
  ├── submission_id (uuid, FK → submissions.id)
  ├── reviewer_id (uuid, FK → profiles.id)
  ├── review_reason (text)
  ├── decision (enum: approved, rejected, flagged)
  └── created_at (timestamptz)

audit_logs
  ├── id (uuid, PK)
  ├── actor_id (uuid, FK → profiles.id)
  ├── actor_role (enum: STUDENT, ADMIN)
  ├── action (varchar)
  ├── target_type (varchar)
  ├── target_id (uuid)
  ├── old_state (jsonb, nullable)
  ├── new_state (jsonb, nullable)
  ├── metadata (jsonb, nullable)
  └── created_at (timestamptz)

ai_usage_logs
  ├── id (uuid, PK)
  ├── user_id (uuid, FK → profiles.id)
  ├── session_id (uuid, nullable)
  ├── provider (varchar)
  ├── model (varchar)
  ├── request_type (varchar)
  ├── input_tokens (int)
  ├── output_tokens (int)
  ├── total_tokens (int)
  ├── latency_ms (int)
  ├── estimated_cost (float, nullable)
  ├── status (enum: success, error)
  ├── error (text, nullable)
  └── created_at (timestamptz)

feature_flags
  ├── id (uuid, PK)
  ├── name (varchar, UNIQUE)
  ├── enabled (boolean) DEFAULT false
  ├── description (text, nullable)
  ├── version (int) DEFAULT 1
  └── updated_at (timestamptz)

experiments
  ├── id (uuid, PK)
  ├── name (varchar)
  ├── version (int)
  ├── algorithm_version (varchar, nullable)
  ├── model_version (varchar, nullable)
  ├── prompt_version (varchar, nullable)
  ├── question_set_version (varchar, nullable)
  ├── description (text, nullable)
  └── created_at (timestamptz)

experiment_participants
  ├── experiment_id (uuid, FK → experiments.id)
  ├── research_participant_id (uuid) -- pseudonymized, NOT profiles.id
  ├── condition (varchar) -- adaptive, control, etc.
  └── joined_at (timestamptz)
  PRIMARY KEY(experiment_id, research_participant_id)

evaluation_runs
  ├── id (uuid, PK)
  ├── name (varchar)
  ├── evaluation_type (varchar) -- rag, model_benchmark, learning_algorithm
  ├── model_version (varchar, nullable)
  ├── algorithm_version (varchar, nullable)
  └── created_at (timestamptz)

evaluation_cases
  ├── id (uuid, PK)
  ├── run_id (uuid, FK → evaluation_runs.id)
  ├── question (text)
  ├── expected_sources (text[], nullable)
  ├── expected_answer (text, nullable)
  ├── retrieved_sources (text[], nullable)
  ├── generated_answer (text, nullable)
  └── metrics (jsonb, nullable)
```

## Row Level Security (RLS) Plan

- `profiles`: users can read all, update own
- `student_profiles`: students read/write own, admins read all
- `privacy_settings`: students read/write own
- `attempts`: students read own, insert own, NO update/delete (immutable)
- `mistakes`, `student_mastery`, `student_weaknesses`: students read own
- `questions`: authenticated read, admin write
- `documents`: authenticated read, admin write
- `audit_logs`: admin read only, insert via triggers
- `ai_usage_logs`: users read own, admin read all
- `experiments`, `evaluation_*`: admin only

## Indexes (Planned)
- `attempts(student_id, created_at)`
- `attempts(question_id)`
- `mistakes(student_id, concept_id)`
- `student_mastery(student_id, concept_id)`
- `document_embeddings(embedding)` using ivfflat or hnsw
- `questions(subject_id, status)`
- `document_processing_jobs(status)`
