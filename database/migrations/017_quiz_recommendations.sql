-- PHASE 7: POST-QUIZ RECOMMENDATION ENGINE
-- Intelligent recommendations after quiz completion

-- Recommendations table (enhance existing learning_recommendations if exists)
create table if not exists quiz_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  assessment_id uuid references quiz_assessments(id) on delete cascade not null,
  
  -- Recommendation type
  recommendation_type varchar(50) check (recommendation_type in (
    'review_topic',
    'retry_quiz',
    'challenge_advanced',
    'ask_ai_tutor',
    'practice_more',
    'take_break',
    'focus_weak_topics'
  )) not null,
  
  -- Content
  title text not null,
  description text not null,
  action_url text,
  priority int check (priority between 1 and 5) not null default 3,
  
  -- Associated data
  topic_ids uuid[],
  metadata jsonb,
  
  -- Tracking
  created_at timestamptz default now() not null,
  viewed_at timestamptz,
  acted_on_at timestamptz,
  dismissed_at timestamptz
);

create index idx_quiz_recommendations_student on quiz_recommendations(student_id, created_at desc);
create index idx_quiz_recommendations_assessment on quiz_recommendations(assessment_id);

alter table quiz_recommendations enable row level security;

create policy "Students read own quiz recommendations" on quiz_recommendations
  for select using (auth.uid() = student_id);
create policy "System creates quiz recommendations" on quiz_recommendations
  for insert with check (true);
create policy "Students update own quiz recommendations" on quiz_recommendations
  for update using (auth.uid() = student_id);

-- Function to generate recommendations after quiz
create or replace function generate_quiz_recommendations(
  p_assessment_id uuid
) returns void as $$
declare
  v_student_id uuid;
  v_subject_id uuid;
  v_accuracy float;
  v_score float;
  v_weak_topics uuid[];
  v_weak_topic_names text[];
  v_topic_record record;
begin
  -- Get assessment details
  select student_id, subject_id, accuracy, score
  into v_student_id, v_subject_id, v_accuracy, v_score
  from quiz_assessments
  where id = p_assessment_id;
  
  if v_student_id is null then
    return;
  end if;
  
  -- Get weak topics from this quiz (accuracy < 60%)
  select 
    array_agg(distinct q.topic_id),
    array_agg(distinct t.name)
  into v_weak_topics, v_weak_topic_names
  from quiz_answers qa
  join questions q on qa.question_id = q.id
  join topics t on q.topic_id = t.id
  where qa.assessment_id = p_assessment_id
    and qa.is_correct = false
  group by q.topic_id, t.name
  having count(*) >= 2; -- At least 2 wrong answers in same topic
  
  -- Recommendation 1: Review weak topics
  if v_weak_topics is not null and array_length(v_weak_topics, 1) > 0 then
    insert into quiz_recommendations (
      student_id,
      assessment_id,
      recommendation_type,
      title,
      description,
      action_url,
      priority,
      topic_ids,
      metadata
    ) values (
      v_student_id,
      p_assessment_id,
      'review_topic',
      'Ôn tập các chủ đề còn yếu',
      'Bạn nên ôn lại: ' || array_to_string(v_weak_topic_names, ', '),
      '/tutor',
      5,
      v_weak_topics,
      jsonb_build_object('weak_topics', v_weak_topic_names)
    );
  end if;
  
  -- Recommendation 2: Retry quiz if score < 70%
  if v_accuracy < 70 then
    insert into quiz_recommendations (
      student_id,
      assessment_id,
      recommendation_type,
      title,
      description,
      action_url,
      priority,
      metadata
    ) values (
      v_student_id,
      p_assessment_id,
      'retry_quiz',
      'Làm lại quiz để cải thiện',
      'Điểm của bạn là ' || round(v_score) || '/100. Làm lại để đạt kết quả tốt hơn!',
      '/quiz',
      4,
      jsonb_build_object('current_score', v_score)
    );
  end if;
  
  -- Recommendation 3: Challenge with advanced quiz if score >= 85%
  if v_accuracy >= 85 then
    insert into quiz_recommendations (
      student_id,
      assessment_id,
      recommendation_type,
      title,
      description,
      action_url,
      priority,
      metadata
    ) values (
      v_student_id,
      p_assessment_id,
      'challenge_advanced',
      'Thử thách với quiz nâng cao',
      'Bạn đã làm rất tốt! Hãy thử mức độ khó hơn.',
      '/quiz?difficulty=advanced',
      3,
      jsonb_build_object('current_score', v_score)
    );
  end if;
  
  -- Recommendation 4: Ask AI Tutor about mistakes
  if v_accuracy < 80 and v_accuracy > 0 then
    insert into quiz_recommendations (
      student_id,
      assessment_id,
      recommendation_type,
      title,
      description,
      action_url,
      priority,
      metadata
    ) values (
      v_student_id,
      p_assessment_id,
      'ask_ai_tutor',
      'Hỏi AI Tutor về câu sai',
      'Giải thích chi tiết các câu bạn làm sai để hiểu rõ hơn.',
      '/tutor',
      4,
      jsonb_build_object('wrong_count', (100 - v_accuracy) / 100)
    );
  end if;
  
  -- Recommendation 5: Practice more if total attempts < 10
  declare
    v_total_quizzes int;
  begin
    select count(*) into v_total_quizzes
    from quiz_assessments
    where student_id = v_student_id
      and subject_id = v_subject_id
      and completed_at is not null;
    
    if v_total_quizzes < 10 then
      insert into quiz_recommendations (
        student_id,
        assessment_id,
        recommendation_type,
        title,
        description,
        action_url,
        priority,
        metadata
      ) values (
        v_student_id,
        p_assessment_id,
        'practice_more',
        'Luyện tập thêm',
        'Làm thêm quiz để cải thiện kỹ năng. Bạn đã hoàn thành ' || v_total_quizzes || ' quiz.',
        '/quiz',
        2,
        jsonb_build_object('total_quizzes', v_total_quizzes)
      );
    end if;
  end;
  
end;
$$ language plpgsql security definer;

-- Trigger to generate recommendations after quiz completion
create or replace function trigger_generate_recommendations() returns trigger as $$
begin
  perform generate_quiz_recommendations(NEW.id);
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists quiz_recommendations_trigger on quiz_assessments;
create trigger quiz_recommendations_trigger
  after update on quiz_assessments
  for each row
  when (NEW.completed_at is not null and OLD.completed_at is null)
  execute function trigger_generate_recommendations();
