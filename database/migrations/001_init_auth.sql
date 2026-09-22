create extension if not exists "uuid-ossp";

create type user_role as enum ('STUDENT', 'ADMIN');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(50) unique not null,
  display_name varchar(100),
  role user_role default 'STUDENT' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table student_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references profiles(id) on delete cascade,
  grade int check (grade >= 10 and grade <= 12) not null,
  class_name varchar(50),
  subjects text[] default '{}',
  learning_goals text,
  target_exam varchar(100),
  study_preferences jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table privacy_settings (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid unique not null references student_profiles(id) on delete cascade,
  allow_ai_profile boolean default true,
  allow_ai_history boolean default true,
  allow_ai_mistakes boolean default true,
  allow_ai_mastery boolean default true,
  allow_ai_study_sessions boolean default true,
  allow_personalization boolean default true,
  allow_proactive_recommendations boolean default false,
  updated_at timestamptz default now() not null
);

alter table profiles enable row level security;
alter table student_profiles enable row level security;
alter table privacy_settings enable row level security;

create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Students can view own student profile" on student_profiles for select using (auth.uid() = user_id);
create policy "Admins can view all student profiles" on student_profiles for select using (exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Students can insert own student profile" on student_profiles for insert with check (auth.uid() = user_id);
create policy "Students can update own student profile" on student_profiles for update using (auth.uid() = user_id);

create policy "Students can view own privacy settings" on privacy_settings for select using (exists (select 1 from student_profiles sp where sp.id = student_id and sp.user_id = auth.uid()));
create policy "Students can update own privacy settings" on privacy_settings for update using (exists (select 1 from student_profiles sp where sp.id = student_id and sp.user_id = auth.uid()));
create policy "Students can insert own privacy settings" on privacy_settings for insert with check (exists (select 1 from student_profiles sp where sp.id = student_id and sp.user_id = auth.uid()));

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();