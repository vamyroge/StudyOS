create table classes (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid references grades(id) on delete set null,
  name varchar(50) not null,
  subject_id uuid references subjects(id) on delete set null,
  created_at timestamptz default now() not null
);

create table student_classes (
  student_id uuid references profiles(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  enrolled_at timestamptz default now() not null,
  primary key (student_id, class_id)
);

create index idx_student_classes_student on student_classes(student_id);
create index idx_student_classes_class on student_classes(class_id);

alter table classes enable row level security;
alter table student_classes enable row level security;

create policy "Students read classes" on classes for select to authenticated using (true);
create policy "Students read own student_classes" on student_classes for select using (auth.uid() = student_id);
create policy "Students insert own student_classes" on student_classes for insert with check (auth.uid() = student_id);

alter table quiz_assessments add column class_id uuid references classes(id) on delete set null;
create index idx_quiz_assessments_class on quiz_assessments(class_id);

alter table quiz_assessments enable row level security;

create policy "Students read own assessments by class" on quiz_assessments 
  for select using (auth.uid() = student_id);
