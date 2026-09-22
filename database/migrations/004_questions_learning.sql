create type question_type as enum ('multiple_choice', 'true_false', 'fill_blank', 'essay');
create type question_status as enum ('draft', 'review', 'approved', 'rejected', 'archived');
create type error_type as enum ('concept_gap', 'calculation_error', 'formula_misuse', 'misunderstanding', 'reasoning_error', 'reading_error', 'careless_error', 'unknown');

create table questions (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  subject_id uuid references subjects(id) on delete set null,
  grade_id uuid references grades(id) on delete set null,
  chapter_id uuid references chapters(id) on delete set null,
  topic_id uuid references topics(id) on delete set null,
  difficulty float check (difficulty >= 0 and difficulty <= 1),
  question_type question_type not null,
  source varchar(200),
  source_page int,
  estimated_time int,
  status question_status not null default 'draft',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade not null,
  content text not null,
  is_correct boolean not null,
  "order" int not null
);

create table solutions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade not null,
  content text not null,
  steps text[]
);

create table question_concepts (
  question_id uuid references questions(id) on delete cascade not null,
  concept_id uuid references concepts(id) on delete cascade not null,
  primary key (question_id, concept_id)
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete restrict not null,
  answer text not null,
  is_correct boolean not null,
  response_time_ms int,
  metadata jsonb,
  created_at timestamptz default now() not null
);

create table mistakes (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references attempts(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  concept_id uuid references concepts(id) on delete set null,
  error_type error_type not null default 'unknown',
  evidence text,
  confidence float check (confidence >= 0 and confidence <= 1),
  model varchar(100),
  created_at timestamptz default now() not null
);

create table student_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  concept_id uuid references concepts(id) on delete cascade not null,
  mastery_level float check (mastery_level >= 0 and mastery_level <= 1) not null default 0,
  algorithm_version varchar(50) not null default 'v1',
  last_assessed_at timestamptz default now() not null,
  unique(student_id, concept_id)
);

create table student_weaknesses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  concept_id uuid references concepts(id) on delete cascade not null,
  severity float check (severity >= 0 and severity <= 1) not null,
  identified_at timestamptz default now() not null
);

create table study_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  title varchar(300) not null,
  target_date date,
  completed boolean default false,
  created_at timestamptz default now() not null
);

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  duration_seconds int
);

create table learning_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  action varchar(100) not null,
  reason text not null,
  evidence text,
  confidence float check (confidence >= 0 and confidence <= 1),
  created_at timestamptz default now() not null
);

create table review_schedule (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  concept_id uuid references concepts(id) on delete cascade not null,
  last_review timestamptz,
  next_review timestamptz not null,
  interval_days int not null default 1,
  difficulty float check (difficulty >= 0 and difficulty <= 1),
  review_result varchar(50)
);

create index idx_attempts_student_created on attempts(student_id, created_at desc);
create index idx_attempts_question on attempts(question_id);
create index idx_mistakes_student_concept on mistakes(student_id, concept_id);
create index idx_student_mastery_student on student_mastery(student_id);
create index idx_review_schedule_next on review_schedule(next_review);
create index idx_questions_subject_status on questions(subject_id, status);

alter table questions enable row level security;
alter table question_options enable row level security;
alter table solutions enable row level security;
alter table question_concepts enable row level security;
alter table attempts enable row level security;
alter table mistakes enable row level security;
alter table student_mastery enable row level security;
alter table student_weaknesses enable row level security;
alter table study_goals enable row level security;
alter table study_sessions enable row level security;
alter table learning_recommendations enable row level security;
alter table review_schedule enable row level security;

create policy "Read approved questions" on questions for select to authenticated using (status = 'approved');
create policy "Admin manage questions" on questions for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Read options of visible questions" on question_options for select to authenticated using (exists (select 1 from questions q where q.id = question_id and q.status = 'approved'));
create policy "Read solutions of visible questions" on solutions for select to authenticated using (exists (select 1 from questions q where q.id = question_id and q.status = 'approved'));
create policy "Read concepts of visible questions" on question_concepts for select to authenticated using (exists (select 1 from questions q where q.id = question_id and q.status = 'approved'));

create policy "Students read own attempts" on attempts for select using (auth.uid() = student_id);
create policy "Students insert own attempts" on attempts for insert with check (auth.uid() = student_id);
create policy "No update or delete attempts" on attempts for update using (false);
create policy "No delete attempts" on attempts for delete using (false);

create policy "Students read own mistakes" on mistakes for select using (auth.uid() = student_id);
create policy "System inserts mistakes" on mistakes for insert with check (true);
create policy "Students read own mastery" on student_mastery for select using (auth.uid() = student_id);
create policy "Students read own weaknesses" on student_weaknesses for select using (auth.uid() = student_id);
create policy "Students manage own goals" on study_goals for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "Students manage own sessions" on study_sessions for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "Students read own recommendations" on learning_recommendations for select using (auth.uid() = student_id);
create policy "Students manage own reviews" on review_schedule for all using (auth.uid() = student_id) with check (auth.uid() = student_id);