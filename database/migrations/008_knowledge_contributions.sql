create table knowledge_contributions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references profiles(id) on delete cascade,
  title varchar(300) not null,
  content text not null,
  source varchar(500),
  subject_id uuid references subjects(id) on delete set null,
  storage_path varchar(500),
  file_name varchar(300),
  file_type varchar(100),
  file_size integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_knowledge_contributions_submitter on knowledge_contributions(submitter_id, created_at desc);

alter table knowledge_contributions enable row level security;

create policy "Students read own knowledge contributions" on knowledge_contributions
  for select to authenticated using (submitter_id = auth.uid());
create policy "Students insert own knowledge contributions" on knowledge_contributions
  for insert to authenticated with check (submitter_id = auth.uid());
create policy "Admins manage knowledge contributions" on knowledge_contributions
  for all to authenticated using (is_current_user_admin()) with check (is_current_user_admin());

create policy "Students read own submissions" on submissions
  for select to authenticated using (submitter_id = auth.uid());
