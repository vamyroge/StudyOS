-- Add subject to conversations
alter table conversations add column subject_id uuid references subjects(id) on delete set null;
create index idx_conversations_subject on conversations(subject_id);

-- Quiz assessments
create table quiz_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  quiz_type varchar(50) not null check (quiz_type in ('personalized', 'quick_assessment', 'topic_review')),
  total_questions int not null,
  correct_answers int not null,
  score float not null,
  accuracy float not null,
  duration_seconds int,
  difficulty_level varchar(20) check (difficulty_level in ('basic', 'intermediate', 'advanced', 'adaptive')),
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

-- Quiz answers
create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references quiz_assessments(id) on delete cascade not null,
  question_id uuid references questions(id) on delete restrict not null,
  selected_answer text not null,
  is_correct boolean not null,
  time_spent_seconds int,
  created_at timestamptz default now() not null
);

-- Topic mastery tracking
create table topic_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  mastery_score float check (mastery_score >= 0 and mastery_score <= 1) not null default 0,
  confidence float check (confidence >= 0 and confidence <= 1),
  questions_attempted int not null default 0,
  questions_correct int not null default 0,
  last_attempt_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(student_id, subject_id, topic_id)
);

-- Indexes
create index idx_quiz_assessments_student on quiz_assessments(student_id, created_at desc);
create index idx_quiz_assessments_subject on quiz_assessments(subject_id);
create index idx_quiz_answers_assessment on quiz_answers(assessment_id);
create index idx_topic_mastery_student on topic_mastery(student_id, subject_id);
create index idx_topic_mastery_topic on topic_mastery(topic_id);

-- RLS
alter table quiz_assessments enable row level security;
alter table quiz_answers enable row level security;
alter table topic_mastery enable row level security;

create policy "Students read own assessments" on quiz_assessments 
  for select using (auth.uid() = student_id);
create policy "Students insert own assessments" on quiz_assessments 
  for insert with check (auth.uid() = student_id);
create policy "Students update own assessments" on quiz_assessments 
  for update using (auth.uid() = student_id);

create policy "Students read own quiz answers" on quiz_answers 
  for select using (exists (
    select 1 from quiz_assessments qa 
    where qa.id = assessment_id and qa.student_id = auth.uid()
  ));
create policy "Students insert own quiz answers" on quiz_answers 
  for insert with check (exists (
    select 1 from quiz_assessments qa 
    where qa.id = assessment_id and qa.student_id = auth.uid()
  ));

create policy "Students read own topic mastery" on topic_mastery 
  for select using (auth.uid() = student_id);
create policy "System updates topic mastery" on topic_mastery 
  for all using (true) with check (true);

-- Admin policies
create policy "Admin read all assessments" on quiz_assessments 
  for select to authenticated using (is_current_user_admin());
create policy "Admin read all quiz answers" on quiz_answers 
  for select to authenticated using (is_current_user_admin());
create policy "Admin read all topic mastery" on topic_mastery 
  for select to authenticated using (is_current_user_admin());
