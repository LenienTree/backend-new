-- Migration: update_database_schema_v2
-- Run this on your Supabase PostgreSQL instance via the SQL editor (Dashboard -> SQL Editor -> New Query -> Run)
-- Generated: 2026-06-23

-- 1. Create NotificationType Enum if not exists
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM (
        'EVENT_APPROVED',
        'EVENT_REJECTED',
        'REGISTRATION_CONFIRMED',
        'REGISTRATION_APPROVED',
        'REGISTRATION_REJECTED',
        'EVENT_UPDATED',
        'EVENT_CANCELLED',
        'ANNOUNCEMENT',
        'CERTIFICATE_ISSUED',
        'GENERAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Notification Table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- 3. Add dateOfBirth column to User table if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);

-- 4. Add displayOrder and LinkedIn columns to Event table if they don't exist
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requiresLinkedinShare" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "linkedinShareDescription" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "linkedinSharePoster" TEXT;

-- 5. Create HeroSlide, CommunityShowcaseImage, and Testimonial tables if they don't exist
CREATE TABLE IF NOT EXISTS "HeroSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunityShowcaseImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityShowcaseImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "badge" TEXT,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- 6. Clean up/Adjust HomepageSection table if it exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'HomepageSection'
    ) THEN
        -- Rename column label to title if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'HomepageSection' AND column_name = 'label'
        ) THEN
            ALTER TABLE "HomepageSection" RENAME COLUMN "label" TO "title";
        END IF;

        -- Rename column isVisible to visible if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'HomepageSection' AND column_name = 'isVisible'
        ) THEN
            ALTER TABLE "HomepageSection" RENAME COLUMN "isVisible" TO "visible";
        END IF;
    ELSE
        -- Create table if it doesn't exist at all
        CREATE TABLE "HomepageSection" (
            "id" TEXT NOT NULL,
            "key" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "order" INTEGER NOT NULL DEFAULT 0,
            "visible" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

            CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX "HomepageSection_key_key" ON "HomepageSection"("key");
    END IF;
END $$;
