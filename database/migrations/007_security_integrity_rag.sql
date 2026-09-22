-- Security, data-integrity, and retrieval hardening for the initial schema.

create or replace function is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN');
$$;

drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Users read own profile or admins read profiles" on profiles for select to authenticated
  using (auth.uid() = id or is_current_user_admin());

drop policy if exists "System inserts mistakes" on mistakes;
drop policy if exists "System inserts audit logs" on audit_logs;
drop policy if exists "System inserts ai usage" on ai_usage_logs;
drop policy if exists "System inserts messages" on messages;

create policy "Users insert own messages" on messages for insert to authenticated
  with check (
    role = 'user'
    and exists (
      select 1 from conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

alter table student_weaknesses
  add constraint student_weaknesses_student_concept_key unique (student_id, concept_id);

alter table learning_recommendations
  add column status varchar(20) not null default 'active' check (status in ('active', 'dismissed', 'expired')),
  add column dedup_key varchar(200),
  add column generated_at timestamptz not null default now(),
  add column expires_at timestamptz;

create unique index learning_recommendations_student_dedup_key
  on learning_recommendations (student_id, dedup_key)
  where dedup_key is not null;

alter table documents
  add column uploaded_at timestamptz not null default now();

create index idx_document_versions_document_status on document_versions(document_id, status);
alter table document_embeddings alter column embedding type vector(768);
create index idx_document_embeddings_vector on document_embeddings using hnsw (embedding vector_cosine_ops);

create or replace function search_chunks(
  query_embedding vector,
  match_count integer default 5,
  match_threshold double precision default 0.25,
  filter_subject_id uuid default null
)
returns table (
  id uuid,
  content text,
  document_version_id uuid,
  document_id uuid,
  document_title varchar,
  page_number integer,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dc.id,
    dc.content,
    dc.document_version_id,
    d.id as document_id,
    d.title as document_title,
    dc.page_number,
    dc.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  from document_embeddings de
  join document_chunks dc on dc.id = de.chunk_id
  join document_versions dv on dv.id = dc.document_version_id
  join documents d on d.id = dv.document_id
  where dv.status = 'ready'
    and (filter_subject_id is null or d.subject_id = filter_subject_id)
    and 1 - (de.embedding <=> query_embedding) >= match_threshold
  order by de.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

revoke all on function search_chunks(vector, integer, double precision, uuid) from public;
grant execute on function search_chunks(vector, integer, double precision, uuid) to authenticated, service_role;

insert into storage.buckets (id, name, public)
values ('knowledge-documents', 'knowledge-documents', false)
on conflict (id) do nothing;

create policy "Admins manage knowledge storage" on storage.objects for all to authenticated
  using (
    bucket_id = 'knowledge-documents'
    and is_current_user_admin()
  )
  with check (
    bucket_id = 'knowledge-documents'
    and is_current_user_admin()
  );
