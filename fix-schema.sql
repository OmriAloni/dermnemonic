-- Fix media_type constraint to include 'summary-table'
ALTER TABLE learning_aids DROP CONSTRAINT IF EXISTS learning_aids_media_type_check;
ALTER TABLE learning_aids ADD CONSTRAINT learning_aids_media_type_check 
  CHECK (media_type IN ('illustration', 'table', 'summary-table', 'character', 'text-only', 'audio', 'video', 'photo'));
