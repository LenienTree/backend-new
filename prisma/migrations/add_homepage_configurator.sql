-- Migration: add_homepage_configurator + schema drift catch-up
-- Run this on your Supabase instance via the SQL editor.
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS).

-- ── Event: new columns ───────────────────────────────────────────────────────
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "displayOrder"              INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requiresLinkedinShare"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "linkedinShareDescription"  TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "linkedinSharePoster"       TEXT;
CREATE INDEX IF NOT EXISTS "Event_displayOrder_idx" ON "Event"("displayOrder");

-- ── User: new columns ────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth"          TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "internshipInterest"   BOOLEAN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "internshipDomains"    TEXT[] NOT NULL DEFAULT '{}';

-- ── HomepageSection ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "HomepageSection" (
    "id"        TEXT NOT NULL,
    "key"       TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "visible"   BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSection_key_key" ON "HomepageSection"("key");
CREATE INDEX IF NOT EXISTS "HomepageSection_order_idx" ON "HomepageSection"("order");

-- Seed default sections (idempotent)
INSERT INTO "HomepageSection" ("id","key","title","order","visible","createdAt","updatedAt") VALUES
    (gen_random_uuid()::text,'hackathons','Hackathons',1,true,NOW(),NOW()),
    (gen_random_uuid()::text,'ideathons','Ideathons',2,true,NOW(),NOW()),
    (gen_random_uuid()::text,'webinars','Webinars',3,true,NOW(),NOW()),
    (gen_random_uuid()::text,'events','Other Events',4,true,NOW(),NOW())
ON CONFLICT ("key") DO NOTHING;

-- ── HeroSlide (banner carousel) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "HeroSlide" (
    "id"        TEXT NOT NULL,
    "imageUrl"  TEXT NOT NULL,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HeroSlide_order_idx" ON "HeroSlide"("order");

-- ── CommunityShowcaseImage ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CommunityShowcaseImage" (
    "id"        TEXT NOT NULL,
    "imageUrl"  TEXT NOT NULL,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityShowcaseImage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CommunityShowcaseImage_order_idx" ON "CommunityShowcaseImage"("order");

-- ── Testimonial ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "role"      TEXT NOT NULL,
    "quote"     TEXT NOT NULL,
    "avatarUrl" TEXT,
    "badge"     TEXT,
    "link"      TEXT,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Testimonial_order_idx" ON "Testimonial"("order");

-- ── Notification ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'EVENT_APPROVED','EVENT_REJECTED','REGISTRATION_CONFIRMED',
      'REGISTRATION_APPROVED','REGISTRATION_REJECTED','EVENT_UPDATED',
      'EVENT_CANCELLED','ANNOUNCEMENT','CERTIFICATE_ISSUED','GENERAL'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "type"        "NotificationType" NOT NULL,
    "title"       TEXT NOT NULL,
    "message"     TEXT NOT NULL,
    "entityId"    TEXT,
    "entityType"  TEXT,
    "isRead"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx"   ON "Notification"("userId","isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId","createdAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;  -- NOT VALID skips row scan, safe for existing data
