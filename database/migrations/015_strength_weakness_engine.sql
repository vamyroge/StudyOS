-- PHASE 4: STRENGTH/WEAKNESS ENGINE
-- Advanced analysis of student performance patterns

-- Strength/Weakness tracking table
create table student_strengths_weaknesses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  
  -- Classification
  classification varchar(20) check (classification in ('strength', 'weakness', 'neutral')) not null,
  confidence float check (confidence >= 0 and confidence <= 1) not null default 0.5,
  
  -- Performance metrics
  total_attempts int not null default 0,
  correct_attempts int not null default 0,
  recent_accuracy float not null default 0,
  historical_accuracy float not null default 0,
  trend varchar(20) check (trend in ('improving', 'stable', 'declining', 'unknown')) not null default 'unknown',
  
  -- Pattern detection
  consecutive_correct int not null default 0,
  consecutive_incorrect int not null default 0,
  last_attempt_correct boolean,
  days_since_last_attempt int,
  
  -- Timestamps
  first_identified_at timestamptz default now() not null,
  last_updated_at timestamptz default now() not null,
  last_attempt_at timestamptz,
  
  unique(student_id, topic_id)
);

-- Mistake patterns tracking
create table mistake_patterns (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  
  -- Pattern classification
  pattern_type varchar(50) check (pattern_type in (
    'conceptual_mistake',
    'calculation_mistake',
    'misread_question',
    'formula_mistake',
    'careless_mistake',
    'unknown'
  )) not null,
  
  -- Pattern details
  occurrence_count int not null default 1,
  first_occurred_at timestamptz default now() not null,
  last_occurred_at timestamptz default now() not null,
  severity float check (severity >= 0 and severity <= 1) not null default 0.5,
  
  -- Associated questions
  question_ids uuid[] not null default '{}',
  
  unique(student_id, topic_id, pattern_type)
);

-- Improvement tracking
create table improvement_tracking (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  
  -- Before/After metrics
  baseline_accuracy float not null,
  current_accuracy float not null,
  improvement_percentage float not null,
  
  -- Time tracking
  baseline_date timestamptz not null,
  measurement_date timestamptz default now() not null,
  days_elapsed int not null,
  
  -- Milestones
  milestone varchar(50) check (milestone in (
    'first_correct',
    'consistency_achieved',
    'mastery_achieved',
    'weakness_overcome'
  )),
  
  metadata jsonb
);

-- Indexes
create index idx_strengths_weaknesses_student on student_strengths_weaknesses(student_id, classification);
create index idx_strengths_weaknesses_topic on student_strengths_weaknesses(topic_id);
create index idx_strengths_weaknesses_subject on student_strengths_weaknesses(subject_id, classification);
create index idx_mistake_patterns_student on mistake_patterns(student_id, severity desc);
create index idx_mistake_patterns_topic on mistake_patterns(topic_id);
create index idx_improvement_tracking_student on improvement_tracking(student_id, measurement_date desc);

-- RLS Policies
alter table student_strengths_weaknesses enable row level security;
alter table mistake_patterns enable row level security;
alter table improvement_tracking enable row level security;

create policy "Students read own strengths/weaknesses" on student_strengths_weaknesses
  for select using (auth.uid() = student_id);
create policy "System manages strengths/weaknesses" on student_strengths_weaknesses
  for all using (true) with check (true);

create policy "Students read own mistake patterns" on mistake_patterns
  for select using (auth.uid() = student_id);
create policy "System manages mistake patterns" on mistake_patterns
  for all using (true) with check (true);

create policy "Students read own improvement tracking" on improvement_tracking
  for select using (auth.uid() = student_id);
create policy "System manages improvement tracking" on improvement_tracking
  for all using (true) with check (true);

-- Admin policies
create policy "Admin read all strengths/weaknesses" on student_strengths_weaknesses
  for select to authenticated using (is_current_user_admin());
create policy "Admin read all mistake patterns" on mistake_patterns
  for select to authenticated using (is_current_user_admin());
create policy "Admin read all improvement tracking" on improvement_tracking
  for select to authenticated using (is_current_user_admin());

-- Function to analyze and update strength/weakness
create or replace function update_strength_weakness_analysis(
  p_student_id uuid,
  p_topic_id uuid
) returns void as $$
declare
  v_subject_id uuid;
  v_total_attempts int;
  v_correct_attempts int;
  v_recent_accuracy float;
  v_historical_accuracy float;
  v_trend varchar(20);
  v_classification varchar(20);
  v_confidence float;
  v_last_5_attempts boolean[];
  v_consecutive_correct int := 0;
  v_consecutive_incorrect int := 0;
  v_last_attempt_correct boolean;
  v_days_since_last int;
begin
  -- Get subject_id
  select subject_id into v_subject_id
  from topics
  where id = p_topic_id;
  
  -- Get total attempts and accuracy
  select 
    count(*),
    sum(case when qa.is_correct then 1 else 0 end)
  into v_total_attempts, v_correct_attempts
  from quiz_answers qa
  join questions q on qa.question_id = q.id
  where q.topic_id = p_topic_id
    and qa.assessment_id in (
      select id from quiz_assessments 
      where student_id = p_student_id
    );
  
  if v_total_attempts = 0 then
    return; -- Not enough data
  end if;
  
  v_historical_accuracy := v_correct_attempts::float / v_total_attempts;
  
  -- Get recent accuracy (last 10 attempts)
  select 
    avg(case when qa.is_correct then 1.0 else 0.0 end)
  into v_recent_accuracy
  from (
    select qa.is_correct
    from quiz_answers qa
    join questions q on qa.question_id = q.id
    where q.topic_id = p_topic_id
      and qa.assessment_id in (
        select id from quiz_assessments 
        where student_id = p_student_id
      )
    order by qa.created_at desc
    limit 10
  ) recent;
  
  -- Determine trend
  if v_recent_accuracy > v_historical_accuracy + 0.15 then
    v_trend := 'improving';
  elsif v_recent_accuracy < v_historical_accuracy - 0.15 then
    v_trend := 'declining';
  else
    v_trend := 'stable';
  end if;
  
  -- Get last 5 attempts for consecutive tracking
  select array_agg(qa.is_correct order by qa.created_at desc)
  into v_last_5_attempts
  from (
    select qa.is_correct, qa.created_at
    from quiz_answers qa
    join questions q on qa.question_id = q.id
    where q.topic_id = p_topic_id
      and qa.assessment_id in (
        select id from quiz_assessments 
        where student_id = p_student_id
      )
    order by qa.created_at desc
    limit 5
  ) recent;
  
  -- Calculate consecutive correct/incorrect
  if v_last_5_attempts is not null and array_length(v_last_5_attempts, 1) > 0 then
    v_last_attempt_correct := v_last_5_attempts[1];
    
    for i in 1..array_length(v_last_5_attempts, 1) loop
      if v_last_5_attempts[i] then
        v_consecutive_correct := v_consecutive_correct + 1;
      else
        exit;
      end if;
    end loop;
    
    if not v_last_attempt_correct then
      for i in 1..array_length(v_last_5_attempts, 1) loop
        if not v_last_5_attempts[i] then
          v_consecutive_incorrect := v_consecutive_incorrect + 1;
        else
          exit;
        end if;
      end loop;
    end if;
  end if;
  
  -- Classify as strength or weakness
  v_confidence := least(v_total_attempts::float / 10.0, 1.0);
  
  if v_recent_accuracy >= 0.75 and v_total_attempts >= 5 then
    v_classification := 'strength';
    v_confidence := greatest(v_confidence, 0.7);
  elsif v_recent_accuracy <= 0.5 and v_total_attempts >= 3 then
    v_classification := 'weakness';
    v_confidence := greatest(v_confidence, 0.6);
  else
    v_classification := 'neutral';
  end if;
  
  -- Calculate days since last attempt
  select extract(day from now() - max(qa.created_at))::int
  into v_days_since_last
  from quiz_answers qa
  join questions q on qa.question_id = q.id
  where q.topic_id = p_topic_id
    and qa.assessment_id in (
      select id from quiz_assessments 
      where student_id = p_student_id
    );
  
  -- Upsert strength/weakness record
  insert into student_strengths_weaknesses (
    student_id,
    topic_id,
    subject_id,
    classification,
    confidence,
    total_attempts,
    correct_attempts,
    recent_accuracy,
    historical_accuracy,
    trend,
    consecutive_correct,
    consecutive_incorrect,
    last_attempt_correct,
    days_since_last_attempt,
    last_updated_at,
    last_attempt_at
  ) values (
    p_student_id,
    p_topic_id,
    v_subject_id,
    v_classification,
    v_confidence,
    v_total_attempts,
    v_correct_attempts,
    coalesce(v_recent_accuracy, 0),
    v_historical_accuracy,
    v_trend,
    v_consecutive_correct,
    v_consecutive_incorrect,
    v_last_attempt_correct,
    v_days_since_last,
    now(),
    now() - (v_days_since_last || ' days')::interval
  )
  on conflict (student_id, topic_id) do update set
    classification = excluded.classification,
    confidence = excluded.confidence,
    total_attempts = excluded.total_attempts,
    correct_attempts = excluded.correct_attempts,
    recent_accuracy = excluded.recent_accuracy,
    historical_accuracy = excluded.historical_accuracy,
    trend = excluded.trend,
    consecutive_correct = excluded.consecutive_correct,
    consecutive_incorrect = excluded.consecutive_incorrect,
    last_attempt_correct = excluded.last_attempt_correct,
    days_since_last_attempt = excluded.days_since_last_attempt,
    last_updated_at = now(),
    last_attempt_at = excluded.last_attempt_at;
end;
$$ language plpgsql security definer;

-- Trigger to update strength/weakness after quiz completion
create or replace function trigger_update_strength_weakness() returns trigger as $$
declare
  v_topic_ids uuid[];
begin
  -- Get all topics from quiz
  select array_agg(distinct q.topic_id)
  into v_topic_ids
  from quiz_answers qa
  join questions q on qa.question_id = q.id
  where qa.assessment_id = NEW.id;
  
  -- Update analysis for each topic
  if v_topic_ids is not null then
    for i in 1..array_length(v_topic_ids, 1) loop
      perform update_strength_weakness_analysis(NEW.student_id, v_topic_ids[i]);
    end loop;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

create trigger quiz_strength_weakness_trigger
  after update on quiz_assessments
  for each row
  when (NEW.completed_at is not null and OLD.completed_at is null)
  execute function trigger_update_strength_weakness();
