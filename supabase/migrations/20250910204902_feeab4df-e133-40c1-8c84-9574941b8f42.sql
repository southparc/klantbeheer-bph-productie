-- Fix phone numbers missing leading zero
UPDATE clients 
SET phone = '0' || phone
WHERE phone IS NOT NULL 
  AND phone != ''
  AND phone NOT LIKE '0%'
  AND phone NOT LIKE '+%'
  AND LENGTH(phone) = 9
  AND phone ~ '^[0-9]+$';