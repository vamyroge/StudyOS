create type submission_status as enum ('pending', 'processing', 'flagged', 'approved', 'rejected', 'archived');
create type moderation_decision as enum ('approved', 'rejected', 'flagged');
create type ai_log_status as enum ('success', 'error');

create table submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid references profiles(id) on delete cascade not null,
  target_type varchar(50) not null,
  target_id uuid not null,
  status submission_status not null default 'pending',
  source varchar(200),
  version int not null default 1,
  created_at timestamptz default now() not null
);

create table moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete restrict not null,
  review_reason text,
  decision moderation_decision not null,
  created_at timestamptz default now() not null
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  actor_role user_role not null,
  action varchar(100) not null,
  target_type varchar(50),
  target_id uuid,
  old_state jsonb,
  new_state jsonb,
  metadata jsonb,
  created_at timestamptz default now() not null
);

create table ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  session_id uuid,
  provider varchar(50) not null,
  model varchar(100) not null,
  request_type varchar(50) not null,
  input_tokens int,
  output_tokens int,
  total_tokens int,
  latency_ms int,
  estimated_cost float,
  status ai_log_status not null,
  error text,
  created_at timestamptz default now() not null
);

create table feature_flags (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) unique not null,
  enabled boolean not null default false,
  description text,
  version int not null default 1,
  updated_at timestamptz default now() not null
);

create table experiments (
  id uuid primary key default gen_random_uuid(),
  name varchar(300) not null,
  version int not null default 1,
  algorithm_version varchar(50),
  model_version varchar(100),
  prompt_version varchar(50),
  question_set_version varchar(50),
  dataset_version varchar(50),
  description text,
  created_at timestamptz default now() not null
);

create table experiment_participants (
  experiment_id uuid references experiments(id) on delete cascade not null,
  research_participant_id uuid not null,
  condition varchar(50) not null,
  joined_at timestamptz default now() not null,
  primary key (experiment_id, research_participant_id)
);

create table evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  name varchar(300) not null,
  evaluation_type varchar(50) not null,
  model_version varchar(100),
  algorithm_version varchar(50),
  created_at timestamptz default now() not null
);

create table evaluation_cases (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references evaluation_runs(id) on delete cascade not null,
  question text not null,
  expected_sources text[],
  expected_answer text,
  retrieved_sources text[],
  generated_answer text,
  metrics jsonb
);

create index idx_audit_logs_actor on audit_logs(actor_id, created_at desc);
create index idx_ai_usage_logs_user on ai_usage_logs(user_id, created_at desc);
create index idx_submissions_status on submissions(status);
create index idx_evaluation_cases_run on evaluation_cases(run_id);

alter table submissions enable row level security;
alter table moderation_reviews enable row level security;
alter table audit_logs enable row level security;
alter table ai_usage_logs enable row level security;
alter table feature_flags enable row level security;
alter table experiments enable row level security;
alter table experiment_participants enable row level security;
alter table evaluation_runs enable row level security;
alter table evaluation_cases enable row level security;

create policy "Students insert own submissions" on submissions for insert with check (auth.uid() = submitter_id);
create policy "Admins manage submissions" on submissions for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Admins read moderation reviews" on moderation_reviews for select to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Admins insert moderation reviews" on moderation_reviews for insert to authenticated with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));

create policy "No direct read audit logs" on audit_logs for select using (false);
create policy "System inserts audit logs" on audit_logs for insert with check (true);

create policy "Users read own ai usage" on ai_usage_logs for select using (auth.uid() = user_id);
create policy "Admins read all ai usage" on ai_usage_logs for select to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "System inserts ai usage" on ai_usage_logs for insert with check (true);

create policy "Authenticated read feature flags" on feature_flags for select to authenticated using (true);
create policy "Admins manage feature flags" on feature_flags for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));

create policy "Admins manage experiments" on experiments for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Admins manage participants" on experiment_participants for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Admins manage evaluations" on evaluation_runs for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Admins manage eval cases" on evaluation_cases for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));