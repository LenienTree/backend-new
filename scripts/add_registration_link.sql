-- Step 1: Add the registrationLink column to Event table (if not exists)
ALTER TABLE "Event"
ADD COLUMN IF NOT EXISTS "registrationLink" TEXT;

-- Step 2: Set the registrationLink for the specific event
UPDATE "Event"
SET "registrationLink" = 'https://forms.gle/cMgxpXWnE8UWxTWV7'
WHERE id = 'e26125b9-6870-4ed8-b9cc-c5d64c4f3792';
