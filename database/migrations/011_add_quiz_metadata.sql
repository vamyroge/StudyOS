-- Add metadata column to quiz_answers for storing topic and difficulty info
alter table quiz_answers add column metadata jsonb default '{}'::jsonb;

-- Create index for metadata queries
create index idx_quiz_answers_metadata on quiz_answers using gin(metadata);
