-- PHASE 1: LEARNING STREAK SYSTEM
-- Tracking user learning activities and streaks

-- Learning activities log (for heatmap and streak calculation)
create table learning_activities (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  activity_type varchar(50) not null check (activity_type in (
    'quiz_completed',
    'lesson_completed', 
    'question_submitted',
    'study_task_completed',
    'review_session_completed',
    'conversation_created'
  )),
  activity_date date not null,
  activity_count int not null default 1,
  metadata jsonb,
  created_at timestamptz default now() not null,
  unique(student_id, activity_type, activity_date)
);

-- Learning streaks (computed daily)
create table learning_streaks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null unique,
  current_streak int not null default 0,
  best_streak int not null default 0,
  total_days_studied int not null default 0,
  last_activity_date date,
  streak_start_date date,
  updated_at timestamptz default now() not null
);

-- Daily activity summary (for quick heatmap queries)
create table daily_activity_summary (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  activity_date date not null,
  total_activities int not null default 0,
  activity_level varchar(20) check (activity_level in ('none', 'low', 'medium', 'high')) not null default 'none',
  quiz_count int not null default 0,
  question_count int not null default 0,
  study_minutes int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(student_id, activity_date)
);

-- Streak milestones achieved
create table streak_milestones (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  milestone_days int not null check (milestone_days in (3, 7, 14, 30, 60, 100)),
  achieved_at timestamptz default now() not null,
  streak_count int not null default 1,
  unique(student_id, milestone_days, achieved_at)
);

-- Indexes
create index idx_learning_activities_student_date on learning_activities(student_id, activity_date desc);
create index idx_learning_activities_date on learning_activities(activity_date);
create index idx_learning_streaks_student on learning_streaks(student_id);
create index idx_daily_activity_summary_student_date on daily_activity_summary(student_id, activity_date desc);
create index idx_streak_milestones_student on streak_milestones(student_id, achieved_at desc);

-- RLS Policies
alter table learning_activities enable row level security;
alter table learning_streaks enable row level security;
alter table daily_activity_summary enable row level security;
alter table streak_milestones enable row level security;

-- Students read own activities
create policy "Students read own activities" on learning_activities 
  for select using (auth.uid() = student_id);
create policy "System inserts activities" on learning_activities 
  for insert with check (true);
create policy "System updates activities" on learning_activities 
  for update using (true);

-- Students read own streaks
create policy "Students read own streaks" on learning_streaks 
  for select using (auth.uid() = student_id);
create policy "System manages streaks" on learning_streaks 
  for all using (true) with check (true);

-- Students read own daily summary
create policy "Students read own daily summary" on daily_activity_summary 
  for select using (auth.uid() = student_id);
create policy "System manages daily summary" on daily_activity_summary 
  for all using (true) with check (true);

-- Students read own milestones
create policy "Students read own milestones" on streak_milestones 
  for select using (auth.uid() = student_id);
create policy "System inserts milestones" on streak_milestones 
  for insert with check (true);

-- Admin policies
create policy "Admin read all activities" on learning_activities 
  for select to authenticated using (is_current_user_admin());
create policy "Admin read all streaks" on learning_streaks 
  for select to authenticated using (is_current_user_admin());
create policy "Admin read all daily summary" on daily_activity_summary 
  for select to authenticated using (is_current_user_admin());
create policy "Admin read all milestones" on streak_milestones 
  for select to authenticated using (is_current_user_admin());

-- Function to log learning activity
create or replace function log_learning_activity(
  p_student_id uuid,
  p_activity_type varchar,
  p_activity_date date default current_date,
  p_metadata jsonb default '{}'::jsonb
) returns void as $$
begin
  -- Insert or update activity count
  insert into learning_activities (student_id, activity_type, activity_date, activity_count, metadata)
  values (p_student_id, p_activity_type, p_activity_date, 1, p_metadata)
  on conflict (student_id, activity_type, activity_date)
  do update set 
    activity_count = learning_activities.activity_count + 1,
    metadata = p_metadata;
    
  -- Update daily summary
  insert into daily_activity_summary (student_id, activity_date, total_activities)
  values (p_student_id, p_activity_date, 1)
  on conflict (student_id, activity_date)
  do update set 
    total_activities = daily_activity_summary.total_activities + 1,
    updated_at = now();
    
  -- Update activity level based on total activities
  update daily_activity_summary
  set activity_level = case
    when total_activities = 0 then 'none'
    when total_activities = 1 then 'low'
    when total_activities between 2 and 3 then 'medium'
    else 'high'
  end
  where student_id = p_student_id and activity_date = p_activity_date;
end;
$$ language plpgsql security definer;

-- Function to calculate and update streak
create or replace function update_learning_streak(p_student_id uuid) returns void as $$
declare
  v_last_activity_date date;
  v_current_streak int := 0;
  v_best_streak int := 0;
  v_total_days int := 0;
  v_streak_start_date date;
  v_activity_dates date[];
  v_date date;
  v_prev_date date;
  v_temp_streak int := 0;
begin
  -- Get all unique activity dates for student
  select array_agg(distinct activity_date order by activity_date desc)
  into v_activity_dates
  from learning_activities
  where student_id = p_student_id;
  
  -- If no activities, reset streak
  if v_activity_dates is null or array_length(v_activity_dates, 1) = 0 then
    insert into learning_streaks (student_id, current_streak, best_streak, total_days_studied)
    values (p_student_id, 0, 0, 0)
    on conflict (student_id) do update set
      current_streak = 0,
      last_activity_date = null,
      updated_at = now();
    return;
  end if;
  
  v_total_days := array_length(v_activity_dates, 1);
  v_last_activity_date := v_activity_dates[1];
  
  -- Calculate current streak (from today backwards)
  v_temp_streak := 0;
  foreach v_date in array v_activity_dates loop
    -- Check if date is consecutive from today or previous date
    if v_temp_streak = 0 then
      -- First date: must be today or yesterday
      if v_date >= current_date - interval '1 day' then
        v_temp_streak := 1;
        v_streak_start_date := v_date;
      else
        exit; -- Streak broken
      end if;
    else
      -- Subsequent dates: must be consecutive
      if v_date = v_prev_date - interval '1 day' then
        v_temp_streak := v_temp_streak + 1;
        v_streak_start_date := v_date;
      else
        exit; -- Streak broken
      end if;
    end if;
    v_prev_date := v_date;
  end loop;
  
  v_current_streak := v_temp_streak;
  
  -- Calculate best streak (iterate through all dates)
  v_temp_streak := 1;
  v_best_streak := 1;
  v_prev_date := v_activity_dates[array_length(v_activity_dates, 1)];
  
  for i in reverse array_length(v_activity_dates, 1) - 1 .. 1 loop
    v_date := v_activity_dates[i];
    if v_date = v_prev_date + interval '1 day' then
      v_temp_streak := v_temp_streak + 1;
      if v_temp_streak > v_best_streak then
        v_best_streak := v_temp_streak;
      end if;
    else
      v_temp_streak := 1;
    end if;
    v_prev_date := v_date;
  end loop;
  
  -- Update or insert streak record
  insert into learning_streaks (
    student_id, 
    current_streak, 
    best_streak, 
    total_days_studied,
    last_activity_date,
    streak_start_date,
    updated_at
  )
  values (
    p_student_id,
    v_current_streak,
    v_best_streak,
    v_total_days,
    v_last_activity_date,
    v_streak_start_date,
    now()
  )
  on conflict (student_id) do update set
    current_streak = excluded.current_streak,
    best_streak = greatest(learning_streaks.best_streak, excluded.best_streak),
    total_days_studied = excluded.total_days_studied,
    last_activity_date = excluded.last_activity_date,
    streak_start_date = excluded.streak_start_date,
    updated_at = now();
    
  -- Check and record milestones
  if v_current_streak in (3, 7, 14, 30, 60, 100) then
    insert into streak_milestones (student_id, milestone_days, achieved_at)
    values (p_student_id, v_current_streak, now())
    on conflict do nothing;
  end if;
end;
$$ language plpgsql security definer;

-- Trigger to update streak after quiz completion
create or replace function trigger_update_streak_on_quiz() returns trigger as $$
begin
  perform log_learning_activity(NEW.student_id, 'quiz_completed', current_date);
  perform update_learning_streak(NEW.student_id);
  return NEW;
end;
$$ language plpgsql;

create trigger quiz_completed_streak_trigger
  after insert on quiz_assessments
  for each row
  execute function trigger_update_streak_on_quiz();

-- Trigger to update streak after question attempt
create or replace function trigger_update_streak_on_attempt() returns trigger as $$
begin
  perform log_learning_activity(NEW.student_id, 'question_submitted', current_date);
  perform update_learning_streak(NEW.student_id);
  return NEW;
end;
$$ language plpgsql;

create trigger question_attempt_streak_trigger
  after insert on attempts
  for each row
  execute function trigger_update_streak_on_attempt();

-- Trigger to update streak after conversation
create or replace function trigger_update_streak_on_conversation() returns trigger as $$
begin
  perform log_learning_activity(NEW.user_id, 'conversation_created', current_date);
  perform update_learning_streak(NEW.user_id);
  return NEW;
end;
$$ language plpgsql;

create trigger conversation_streak_trigger
  after insert on conversations
  for each row
  execute function trigger_update_streak_on_conversation();
