-- Migration to convert **text** markdown to <strong>text</strong> HTML
-- This removes markdown support in favor of HTML bold tags

-- Update body field: Convert **text** to <strong>text</strong>
UPDATE learning_aids
SET body = regexp_replace(body, '\*\*(.*?)\*\*', '<strong>\1</strong>', 'g')
WHERE body LIKE '%**%';

-- Update explanation field: Convert **text** to <strong>text</strong>
UPDATE learning_aids
SET explanation = regexp_replace(explanation, '\*\*(.*?)\*\*', '<strong>\1</strong>', 'g')
WHERE explanation LIKE '%**%';

-- Verify: Show any remaining ** patterns (should be none)
SELECT id, title,
  CASE WHEN body LIKE '%**%' THEN 'body has **' ELSE '' END as body_status,
  CASE WHEN explanation LIKE '%**%' THEN 'explanation has **' ELSE '' END as explanation_status
FROM learning_aids
WHERE body LIKE '%**%' OR explanation LIKE '%**%';
