-- Rename EventCategory value Conclave -> Techfest (preserves existing rows)
ALTER TYPE "EventCategory" RENAME VALUE 'Conclave' TO 'Techfest';

-- Add short, shareable event slug
ALTER TABLE "Event" ADD COLUMN "slug" TEXT;

-- Backfill slugs for existing events: slugified title + 8-char id fragment for uniqueness
UPDATE "Event"
SET "slug" =
  COALESCE(
    NULLIF(trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g')), ''),
    'event'
  ) || '-' || substring("id"::text from 1 for 8)
WHERE "slug" IS NULL;

-- Unique index on slug
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
