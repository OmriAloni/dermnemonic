-- Update ALL users' hospital to איכילוב
-- This standardizes all hospital names to איכילוב

UPDATE users
SET hospital = 'איכילוב'
WHERE hospital IS NOT NULL;

-- Verify the update
SELECT id, display_name, hospital, email
FROM users
ORDER BY created_at DESC;
