create table subjects (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  slug varchar(100) unique not null,
  description text
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  level int unique not null check (level >= 1 and level <= 12),
  name varchar(50) not null
);

create table textbook_series (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  name varchar(100) not null,
  publisher varchar(100)
);

create table chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade not null,
  textbook_series_id uuid references textbook_series(id) on delete set null,
  name varchar(200) not null,
  "order" int not null
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id) on delete cascade not null,
  name varchar(200) not null,
  "order" int not null
);

create table concepts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade not null,
  name varchar(200) not null,
  description text
);

create type concept_relation_type as enum ('PREREQUISITE', 'RELATED_TO', 'PART_OF', 'DEPENDS_ON');
create type relation_status as enum ('pending_review', 'verified', 'rejected');

create table concept_relationships (
  id uuid primary key default gen_random_uuid(),
  source_concept_id uuid references concepts(id) on delete cascade not null,
  target_concept_id uuid references concepts(id) on delete cascade not null,
  relationship_type concept_relation_type not null,
  source varchar(50) not null default 'manual',
  confidence float check (confidence >= 0 and confidence <= 1) default 1.0,
  status relation_status not null default 'verified',
  created_by uuid references profiles(id),
  version int not null default 1,
  unique(source_concept_id, target_concept_id, relationship_type, version)
);

alter table subjects enable row level security;
alter table grades enable row level security;
alter table textbook_series enable row level security;
alter table chapters enable row level security;
alter table topics enable row level security;
alter table concepts enable row level security;
alter table concept_relationships enable row level security;

create policy "Authenticated read curriculum" on subjects for select to authenticated using (true);
create policy "Authenticated read curriculum" on grades for select to authenticated using (true);
create policy "Authenticated read curriculum" on textbook_series for select to authenticated using (true);
create policy "Authenticated read curriculum" on chapters for select to authenticated using (true);
create policy "Authenticated read curriculum" on topics for select to authenticated using (true);
create policy "Authenticated read curriculum" on concepts for select to authenticated using (true);
create policy "Authenticated read curriculum" on concept_relationships for select to authenticated using (status = 'verified');

insert into subjects (name, slug) values
  ('Toán', 'math'),
  ('Vật lý', 'physics'),
  ('Hóa học', 'chemistry');

insert into grades (level, name) values
  (10, 'Lớp 10'),
  (11, 'Lớp 11'),
  (12, 'Lớp 12');