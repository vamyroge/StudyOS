create extension if not exists vector;

create type doc_status as enum ('pending', 'processing', 'ready', 'failed');
create type job_status as enum ('queued', 'processing', 'retrying', 'completed', 'failed', 'cancelled');

create table documents (
  id uuid primary key default gen_random_uuid(),
  title varchar(300) not null,
  subject_id uuid references subjects(id) on delete set null,
  storage_path varchar(500) not null,
  file_type varchar(50) not null,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  version int not null,
  content_hash varchar(64) not null,
  source varchar(100),
  status doc_status not null default 'pending',
  created_at timestamptz default now() not null,
  created_by uuid references profiles(id) not null,
  unique(document_id, version)
);

create table document_pages (
  id uuid primary key default gen_random_uuid(),
  document_version_id uuid references document_versions(id) on delete cascade not null,
  page_number int not null,
  content text
);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_version_id uuid references document_versions(id) on delete cascade not null,
  content text not null,
  page_number int,
  chunk_index int not null,
  metadata jsonb default '{}'::jsonb
);

create table document_embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid references document_chunks(id) on delete cascade not null,
  embedding vector not null,
  embedding_model varchar(100) not null,
  embedding_dimension int not null,
  embedding_version varchar(50) not null,
  created_at timestamptz default now() not null
);

create table document_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  status job_status not null default 'queued',
  progress float default 0 check (progress >= 0 and progress <= 1),
  retry_count int default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_document_chunks_doc_version on document_chunks(document_version_id);
create index idx_document_embeddings_chunk on document_embeddings(chunk_id);
create index idx_document_processing_jobs_status on document_processing_jobs(status);

alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_pages enable row level security;
alter table document_chunks enable row level security;
alter table document_embeddings enable row level security;
alter table document_processing_jobs enable row level security;

create policy "Authenticated read ready documents" on documents for select to authenticated using (exists (select 1 from document_versions dv where dv.document_id = documents.id and dv.status = 'ready'));
create policy "Admin manage documents" on documents for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));