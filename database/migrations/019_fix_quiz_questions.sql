-- Fix Quiz System - Store AI-generated quiz questions properly
-- This fixes the 0/10 bug where quiz questions were not persisted to database

-- Create table for AI-generated quiz questions
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references quiz_assessments(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- Array of option texts
  correct_answer_index int not null check (correct_answer_index >= 0 and correct_answer_index <= 3),
  explanation text not null,
  topic varchar(200),
  difficulty varchar(20),
  question_order int not null,
  created_at timestamptz default now() not null
);

-- Update quiz_answers to reference quiz_questions instead of questions
-- First, drop the existing foreign key constraint
alter table quiz_answers drop constraint if exists quiz_answers_question_id_fkey;

-- Add new column for quiz_question_id (nullable during migration)
alter table quiz_answers add column if not exists quiz_question_id uuid references quiz_questions(id) on delete cascade;

-- Make question_id nullable (for backward compatibility with old data)
alter table quiz_answers alter column question_id drop not null;

-- Add constraint: either question_id OR quiz_question_id must be set
alter table quiz_answers add constraint quiz_answers_question_check 
  check (
    (question_id is not null and quiz_question_id is null) or
    (question_id is null and quiz_question_id is not null)
  );

-- Update selected_answer to store index instead of text for consistency
-- Add new column for selected_answer_index
alter table quiz_answers add column if not exists selected_answer_index int;

-- Indexes for performance
create index idx_quiz_questions_assessment on quiz_questions(assessment_id);
create index idx_quiz_questions_order on quiz_questions(assessment_id, question_order);
create index idx_quiz_answers_quiz_question on quiz_answers(quiz_question_id);

-- RLS policies
alter table quiz_questions enable row level security;

create policy "Students read quiz questions for their assessments" on quiz_questions 
  for select using (exists (
    select 1 from quiz_assessments qa 
    where qa.id = assessment_id and qa.student_id = auth.uid()
  ));

create policy "Students insert quiz questions for their assessments" on quiz_questions 
  for insert with check (exists (
    select 1 from quiz_assessments qa 
    where qa.id = assessment_id and qa.student_id = auth.uid()
  ));

create policy "Admin read all quiz questions" on quiz_questions 
  for select to authenticated using (is_current_user_admin());

-- Add metadata column to quiz_assessments for storing quiz metadata
alter table quiz_assessments add column if not exists metadata jsonb;

-- Comments for documentation
comment on table quiz_questions is 'Stores AI-generated quiz questions for quiz assessments';
comment on column quiz_questions.options is 'JSON array of 4 option texts: ["Option A", "Option B", "Option C", "Option D"]';
comment on column quiz_questions.correct_answer_index is 'Index of correct answer (0-3) in options array';
comment on column quiz_answers.selected_answer_index is 'Index of selected answer (0-3) - replaces text-based selected_answer';
comment on constraint quiz_answers_question_check on quiz_answers is 'Ensures either regular question_id or quiz_question_id is set, not both';
