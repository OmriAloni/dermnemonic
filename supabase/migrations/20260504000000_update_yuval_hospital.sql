-- Update hospital for יובל אלון (Yuval Alon) from הדסה to איכילוב
-- This is a targeted update, not a global hospital name change

UPDATE users
SET hospital = 'איכילוב'
WHERE display_name = 'יובל אלון'
  OR display_name = 'ד״ר יובל אלון'
  OR display_name LIKE '%יובל אלון%';

-- Verify the update
SELECT id, display_name, hospital, email
FROM users
WHERE display_name LIKE '%יובל%' OR display_name LIKE '%אלון%';
