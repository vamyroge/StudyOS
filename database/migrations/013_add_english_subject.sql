-- Add English subject
INSERT INTO subjects (name, slug, description) 
VALUES ('Tiếng Anh', 'english', 'Môn Tiếng Anh THPT')
ON CONFLICT (slug) DO NOTHING;

-- Add chapters for English
DO $$
DECLARE
  english_id uuid;
BEGIN
  SELECT id INTO english_id FROM subjects WHERE slug = 'english';
  
  IF english_id IS NOT NULL THEN
    INSERT INTO chapters (subject_id, name, "order") VALUES
      (english_id, 'Grammar', 1),
      (english_id, 'Vocabulary', 2),
      (english_id, 'Reading Comprehension', 3),
      (english_id, 'Writing', 4)
    ON CONFLICT DO NOTHING;
    
    -- Add topics for Grammar chapter
    INSERT INTO topics (chapter_id, name, "order")
    SELECT c.id, t.name, t.ord
    FROM chapters c
    CROSS JOIN (VALUES 
      ('Tenses', 1),
      ('Conditionals', 2),
      ('Passive Voice', 3),
      ('Reported Speech', 4)
    ) AS t(name, ord)
    WHERE c.subject_id = english_id AND c.name = 'Grammar'
    ON CONFLICT DO NOTHING;
    
    -- Add topics for Vocabulary chapter
    INSERT INTO topics (chapter_id, name, "order")
    SELECT c.id, t.name, t.ord
    FROM chapters c
    CROSS JOIN (VALUES 
      ('Word Formation', 1),
      ('Phrasal Verbs', 2),
      ('Idioms', 3),
      ('Collocations', 4)
    ) AS t(name, ord)
    WHERE c.subject_id = english_id AND c.name = 'Vocabulary'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
