-- OPTIMIZATION: Database Indexes & Schema Improvements
-- Phân tích và tối ưu hóa hiệu suất truy vấn

-- 1. Indexes cho learning streak queries (thường xuyên truy vấn)
create index if not exists idx_learning_streaks_current on learning_streaks(current_streak desc);
create index if not exists idx_learning_streaks_best on learning_streaks(best_streak desc);

-- 2. Composite indexes cho heatmap queries
create index if not exists idx_daily_activity_summary_date_level on daily_activity_summary(activity_date, activity_level);

-- 3. Indexes cho topic mastery queries
create index if not exists idx_topic_mastery_mastery on topic_mastery(student_id, mastery_score desc);
create index if not exists idx_topic_mastery_last_attempt on topic_mastery(last_attempt_at desc);

-- 4. Indexes cho quiz assessments
create index if not exists idx_quiz_assessments_accuracy on quiz_assessments(student_id, accuracy desc);
create index if not exists idx_quiz_assessments_subject_score on quiz_assessments(subject_id, score desc);

-- 5. Indexes cho quiz answers
create index if not exists idx_quiz_answers_question on quiz_answers(question_id, is_correct);

-- 6. Indexes cho strength/weakness
create index if not exists idx_strength_weakness_classification on student_strengths_weaknesses(student_id, classification);
create index if not exists idx_strength_weakness_accuracy on student_strengths_weaknesses(recent_accuracy desc);

-- 7. Indexes cho recommendations
create index if not exists idx_quiz_recommendations_priority on quiz_recommendations(student_id, priority desc, created_at desc);

-- 8. Indexes cho mistakes
create index if not exists idx_quiz_answers_mistakes on quiz_answers(is_correct, created_at desc);

-- 9. Indexes cho improvement tracking
create index if not exists idx_improvement_tracking_student on improvement_tracking(student_id, measurement_date desc);

-- 10. Add missing indexes for common joins
create index if not exists idx_questions_topic on questions(topic_id);
create index if not exists idx_quiz_assessments_subject on quiz_assessments(subject_id);

-- 11. Optimize views/queries
-- Create materialized view for daily stats (optional, for very large datasets)
-- Uncomment nếu cần performance cao hơn:
-- create materialized view mv_daily_stats as
--   select student_id, activity_date, sum(total_activities) as total,
--          sum(quiz_count) as quizzes, sum(question_count) as questions
--   from daily_activity_summary
--   group by student_id, activity_date;
-- create index on mv_daily_stats(student_id, activity_date);

-- 12. Add partial indexes cho frequently accessed data
create index if not exists idx_quiz_assessments_recent on quiz_assessments(student_id, completed_at desc)
  where completed_at is not null;

create index if not exists idx_topic_mastery_recent on topic_mastery(student_id, last_attempt_at desc)
  where last_attempt_at is not null;

-- 13. Optimize RLS policies - simplify to improve performance
-- Drop and recreate with simplified conditions
drop policy if exists "System updates activities" on learning_activities;
drop policy if exists "System manages streaks" on learning_streaks;
drop policy if exists "System manages daily summary" on daily_activity_summary;
drop policy if exists "System inserts milestones" on streak_milestones;

-- Create simplified system policies
create policy "System_manage_activities" on learning_activities
  for all using (true);
create policy "System_manage_streaks" on learning_streaks
  for all using (true);
create policy "System_manage_daily_summary" on daily_activity_summary
  for all using (true);
create policy "System_manage_milestones" on streak_milestones
  for all using (true);

-- 14. Add trigger for daily activity summary update
create or replace function update_daily_summary() returns trigger as $$
declare
  v_quiz_count int := 0;
  v_question_count int := 0;
begin
  if TG_OP = 'INSERT' then
    -- Count quiz questions for this assessment
    select count(*) into v_quiz_count
    from quiz_answers qa
    where qa.assessment_id = NEW.id;
    
    v_question_count := v_quiz_count;
    
    -- Update daily summary
    insert into daily_activity_summary (student_id, activity_date, total_activities, quiz_count, question_count)
    select 
      student_id, 
      current_date,
      v_question_count,
      v_quiz_count,
      v_question_count / 5 as study_minutes -- Estimate 5 min per question
    from quiz_assessments where id = NEW.id
    on conflict (student_id, activity_date) do update set
      total_activities = daily_activity_summary.total_activities + v_question_count,
      quiz_count = daily_activity_summary.quiz_count + v_quiz_count,
      question_count = daily_activity_summary.question_count + v_question_count,
      study_minutes = daily_activity_summary.study_minutes + v_question_count / 5,
      updated_at = now();
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger quiz_assessment_summary_trigger
  after update on quiz_assessments
  for each row
  when (NEW.completed_at is not null and OLD.completed_at is null)
  execute function update_daily_summary();

-- 15. Add function to calculate student statistics efficiently
create or replace function get_student_stats_fast(p_student_id uuid)
returns table (
  total_attempts bigint,
  correct_attempts bigint,
  accuracy float,
  quizzes_taken int,
  average_score float
) as $$
begin
  return query
  select 
    coalesce(count(*), 0) as total_attempts,
    coalesce(sum(case when qa.is_correct then 1 else 0 end), 0) as correct_attempts,
    coalesce(avg(case when qa.is_correct then 100.0 else 0.0 end), 0) as accuracy,
    (select count(*) from quiz_assessments where student_id = p_student_id and completed_at is not null) as quizzes_taken,
    (select coalesce(avg(score), 0) from quiz_assessments where student_id = p_student_id and completed_at is not null) as average_score
  from quiz_answers qa
  join quiz_assessments qa2 on qa.assessment_id = qa2.id
  where qa2.student_id = p_student_id;
end;
$$ language plpgsql security definer;

-- 16. Add function for streak calculation optimization
create or replace function get_student_streak_fast(p_student_id uuid)
returns table (
  current_streak int,
  best_streak int,
  total_days_studied int
) as $$
declare
  v_current_streak int := 0;
  v_best_streak int := 0;
  v_total_days int := 0;
  v_date date;
  v_prev_date date;
  v_temp_streak int := 0;
  v_activity_dates date[];
begin
  -- Get unique activity dates
  select array_agg(distinct activity_date order by activity_date desc)
  into v_activity_dates
  from daily_activity_summary
  where student_id = p_student_id and total_activities > 0;
  
  if v_activity_dates is null or array_length(v_activity_dates, 1) = 0 then
    return query select 0, 0, 0;
  end if;
  
  v_total_days := array_length(v_activity_dates, 1);
  
  -- Calculate current streak
  foreach v_date in array v_activity_dates loop
    if v_temp_streak = 0 then
      if v_date >= current_date - interval '1 day' then
        v_temp_streak := 1;
      else
        exit;
      end if;
    else
      if v_date = v_prev_date - interval '1 day' then
        v_temp_streak := v_temp_streak + 1;
      else
        exit;
      end if;
    end if;
    v_prev_date := v_date;
  end loop;
  
  v_current_streak := v_temp_streak;
  
  -- Calculate best streak
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
  
  return query select v_current_streak, v_best_streak, v_total_days;
end;
$$ language plpgsql security definer;

-- 17. Add function for recent quiz performance
create or replace function get_recent_quiz_performance_fast(p_student_id uuid, p_limit int default 14)
returns table (
  quiz_id uuid,
  subject_name text,
  score float,
  accuracy float,
  completed_at timestamptz,
  total_questions int,
  correct_answers int
) as $$
begin
  return query
  select 
    qa.id as quiz_id,
    s.name as subject_name,
    qa.score,
    qa.accuracy,
    qa.completed_at,
    qa.total_questions,
    qa.correct_answers
  from quiz_assessments qa
  left join subjects s on qa.subject_id = s.id
  where qa.student_id = p_student_id
    and qa.completed_at is not null
  order by qa.completed_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;
