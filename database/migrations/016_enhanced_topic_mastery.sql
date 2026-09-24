-- PHASE 6: ENHANCED TOPIC MASTERY CALCULATION
-- Upgrade topic_mastery with advanced algorithms

-- Add computed fields to topic_mastery (already exists from migration 010)
-- We'll enhance it with functions

-- Enhanced mastery calculation function
create or replace function calculate_topic_mastery(
  p_student_id uuid,
  p_topic_id uuid
) returns void as $$
declare
  v_subject_id uuid;
  v_total_questions int := 0;
  v_correct_questions int := 0;
  v_recent_accuracy float := 0;
  v_historical_accuracy float := 0;
  v_confidence float := 0;
  v_mastery_score float := 0;
  v_difficulty_weights float[];
  v_time_decay_factor float;
  v_last_attempt timestamptz;
begin
  -- Get subject_id
  select subject_id into v_subject_id from topics where id = p_topic_id;
  
  -- Get all attempts for this topic
  select 
    count(*),
    sum(case when qa.is_correct then 1 else 0 end),
    max(qa.created_at)
  into v_total_questions, v_correct_questions, v_last_attempt
  from quiz_answers qa
  join questions q on qa.question_id = q.id
  where q.topic_id = p_topic_id
    and qa.assessment_id in (
      select id from quiz_assessments where student_id = p_student_id
    );
  
  if v_total_questions = 0 then
    return; -- Not enough data
  end if;
  
  -- Calculate historical accuracy
  v_historical_accuracy := v_correct_questions::float / v_total_questions;
  
  -- Calculate recent accuracy (last 10 questions, weighted more)
  select avg(case when qa.is_correct then 1.0 else 0.0 end)
  into v_recent_accuracy
  from (
    select qa.is_correct
    from quiz_answers qa
    join questions q on qa.question_id = q.id
    where q.topic_id = p_topic_id
      and qa.assessment_id in (
        select id from quiz_assessments where student_id = p_student_id
      )
    order by qa.created_at desc
    limit 10
  ) recent;
  
  v_recent_accuracy := coalesce(v_recent_accuracy, v_historical_accuracy);
  
  -- Calculate confidence based on number of attempts
  v_confidence := least(
    power(v_total_questions::float / 15.0, 0.7), -- Diminishing returns
    1.0
  );
  
  -- Time decay: reduce confidence if not practiced recently
  if v_last_attempt is not null then
    v_time_decay_factor := exp(-extract(epoch from (now() - v_last_attempt)) / (30 * 24 * 3600)); -- 30 days half-life
  else
    v_time_decay_factor := 0.5;
  end if;
  
  v_confidence := v_confidence * (0.5 + 0.5 * v_time_decay_factor);
  
  -- Calculate weighted mastery score
  -- 60% recent performance + 40% historical performance
  v_mastery_score := (0.6 * v_recent_accuracy + 0.4 * v_historical_accuracy);
  
  -- Apply confidence penalty for low sample size
  v_mastery_score := v_mastery_score * v_confidence;
  
  -- Ensure bounds
  v_mastery_score := greatest(0.0, least(1.0, v_mastery_score));
  v_confidence := greatest(0.0, least(1.0, v_confidence));
  
  -- Upsert topic mastery
  insert into topic_mastery (
    student_id,
    subject_id,
    topic_id,
    mastery_score,
    confidence,
    questions_attempted,
    questions_correct,
    last_attempt_at,
    updated_at
  ) values (
    p_student_id,
    v_subject_id,
    p_topic_id,
    v_mastery_score,
    v_confidence,
    v_total_questions,
    v_correct_questions,
    v_last_attempt,
    now()
  )
  on conflict (student_id, subject_id, topic_id) do update set
    mastery_score = excluded.mastery_score,
    confidence = excluded.confidence,
    questions_attempted = excluded.questions_attempted,
    questions_correct = excluded.questions_correct,
    last_attempt_at = excluded.last_attempt_at,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Trigger to update topic mastery after quiz completion
create or replace function trigger_update_topic_mastery() returns trigger as $$
declare
  v_topic_ids uuid[];
begin
  -- Get all topics from quiz
  select array_agg(distinct q.topic_id)
  into v_topic_ids
  from quiz_answers qa
  join questions q on qa.question_id = q.id
  where qa.assessment_id = NEW.id;
  
  -- Update mastery for each topic
  if v_topic_ids is not null then
    for i in 1..array_length(v_topic_ids, 1) loop
      if v_topic_ids[i] is not null then
        perform calculate_topic_mastery(NEW.student_id, v_topic_ids[i]);
      end if;
    end loop;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Drop existing trigger if exists and recreate
drop trigger if exists quiz_topic_mastery_trigger on quiz_assessments;
create trigger quiz_topic_mastery_trigger
  after update on quiz_assessments
  for each row
  when (NEW.completed_at is not null and OLD.completed_at is null)
  execute function trigger_update_topic_mastery();
