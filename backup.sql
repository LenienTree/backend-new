-- ============================================================
-- Neon DB Backup → Supabase Migration
-- Generated: 2026-06-17T11:00:20.662Z
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ── Enum Types ─────────────────────────────────────────
CREATE TYPE IF NOT EXISTS "ApprovalMode" AS ENUM ('AUTO', 'MANUAL');
CREATE TYPE IF NOT EXISTS "EventCategory" AS ENUM ('Hackathon', 'Ideathon', 'Webinar', 'Conclave', 'Other');
CREATE TYPE IF NOT EXISTS "EventMode" AS ENUM ('ONLINE', 'OFFLINE');
CREATE TYPE IF NOT EXISTS "EventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE IF NOT EXISTS "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');
CREATE TYPE IF NOT EXISTS "PaymentType" AS ENUM ('FREE', 'MANUAL_UPI', 'RAZORPAY');
CREATE TYPE IF NOT EXISTS "PrizeType" AS ENUM ('NONE', 'CASH', 'MERCH', 'POINTS');
CREATE TYPE IF NOT EXISTS "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAYMENT_PENDING', 'ATTENDED');
CREATE TYPE IF NOT EXISTS "RegistrationType" AS ENUM ('INDIVIDUAL', 'GROUP');
CREATE TYPE IF NOT EXISTS "Role" AS ENUM ('ADMIN', 'USER');
CREATE TYPE IF NOT EXISTS "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- ── Table Schemas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "certificateUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" "EventCategory" NOT NULL,
    "theme" TEXT,
    "organizerId" TEXT NOT NULL,
    "mode" "EventMode" NOT NULL DEFAULT 'ONLINE'::"EventMode",
    "venueName" TEXT,
    "address" TEXT,
    "mapLink" TEXT,
    "startDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "registrationDeadline" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "bannerImage" TEXT,
    "eventPoster" TEXT,
    "description" TEXT NOT NULL,
    "prizeType" "PrizeType" NOT NULL DEFAULT 'NONE'::"PrizeType",
    "prizeAmount" DOUBLE PRECISION,
    "maxParticipants" INTEGER,
    "approvalMode" "ApprovalMode" NOT NULL DEFAULT 'AUTO'::"ApprovalMode",
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT'::"EventStatus",
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "registrationType" "RegistrationType" NOT NULL DEFAULT 'INDIVIDUAL'::"RegistrationType",
    "minTeamSize" INTEGER,
    "maxTeamSize" INTEGER,
    "ticketPrice" DOUBLE PRECISION,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'FREE'::"PaymentType",
    "upiId" TEXT,
    "upiQrCode" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "customFormFields" JSONB,
    "rejectionReason" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "deletedAt" TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FAQ" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GalleryImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReferralClick" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING'::"RegistrationStatus",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID'::"PaymentStatus",
    "formData" JSONB,
    "paymentRef" TEXT,
    "paymentProof" TEXT,
    "registeredAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SocialLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkedin" TEXT,
    "github" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER'::"Role",
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "college" TEXT,
    "graduationYear" INTEGER,
    "bio" TEXT,
    "profileImage" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE'::"UserStatus",
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "deletedAt" TIMESTAMP WITHOUT TIME ZONE,
    "internshipDomains" TEXT[],
    "internshipInterest" BOOLEAN,
    "dateOfBirth" TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX "AuditLog_entity_entityId_idx" ON public."AuditLog" USING btree (entity, "entityId");
CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");
CREATE UNIQUE INDEX "Bookmark_userId_eventId_key" ON public."Bookmark" USING btree ("userId", "eventId");
CREATE UNIQUE INDEX "Certificate_userId_eventId_key" ON public."Certificate" USING btree ("userId", "eventId");
CREATE INDEX "Event_category_idx" ON public."Event" USING btree (category);
CREATE INDEX "Event_organizerId_idx" ON public."Event" USING btree ("organizerId");
CREATE INDEX "Event_startDate_idx" ON public."Event" USING btree ("startDate");
CREATE INDEX "Event_status_idx" ON public."Event" USING btree (status);
CREATE UNIQUE INDEX "Referral_code_key" ON public."Referral" USING btree (code);
CREATE INDEX "Registration_eventId_idx" ON public."Registration" USING btree ("eventId");
CREATE UNIQUE INDEX "Registration_eventId_userId_key" ON public."Registration" USING btree ("eventId", "userId");
CREATE INDEX "Registration_status_idx" ON public."Registration" USING btree (status);
CREATE INDEX "Registration_userId_idx" ON public."Registration" USING btree ("userId");
CREATE UNIQUE INDEX "SocialLink_userId_key" ON public."SocialLink" USING btree ("userId");
CREATE INDEX "User_email_idx" ON public."User" USING btree (email);
CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);
CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");
CREATE INDEX "User_status_idx" ON public."User" USING btree (status);
CREATE UNIQUE INDEX "UserSkill_userId_skill_key" ON public."UserSkill" USING btree ("userId", skill);

-- ── Foreign Keys ───────────────────────────────────────────
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- ── Data ───────────────────────────────────────────────────

SET session_replication_role = replica;

-- Announcement (10 rows)
INSERT INTO "Announcement" ("id", "eventId", "title", "content", "publishDate", "createdBy", "createdAt", "updatedAt") VALUES
    ('c348de47-23b6-4adc-99b4-3ce53c659663', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'Registration Now Open! 🎉', 'Registrations for LenientHack 2026 are officially open! Early registration closes on April 5th. Register now to secure your spot.', '2026-03-01T04:30:00.000Z', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('7600e42c-1178-492c-aa0a-aba594d9d771', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'Problem Statements Released 📋', 'The 5 problem statements for LenientHack 2026 have been released! Each team must choose one domain before the event starts.', '2026-03-15T04:30:00.000Z', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('b05c7992-2517-4093-a97b-06878925ca45', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'Mentors Joining Us! 🚀', 'We have 20+ experienced mentors from Google, Microsoft, and Razorpay joining during the hackathon. Use their expertise to build something great!', '2026-03-20T04:30:00.000Z', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('3c32d6cc-0085-467a-b1e6-86b725713d34', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', 'Judges Announced 🏆', 'Our panel: 3 venture capitalists, 2 startup founders, and 1 government innovation officer. Prepare to impress!', '2026-03-10T04:30:00.000Z', '5a2cb68f-984c-49c9-b28f-04fda56dd64a', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('7edeb666-406b-424b-b699-9e968654e4d3', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', 'Workshop on Pitch Decks', 'Free workshop on March 30th on creating compelling pitch decks. Check your email for the invite link.', '2026-03-12T04:30:00.000Z', '5a2cb68f-984c-49c9-b28f-04fda56dd64a', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('33f3ca88-8f92-4888-9cef-be4bd4e89f39', 'a824decf-1fc3-446e-b5ba-6b0270d15c7f', 'Speaker Lineup Revealed! 🔐', 'Speakers: Rajesh Kumar (CERT-In), Anita Singh (HackerOne Top 50), and Dr. Mehta (DRDO). An incredible session awaits!', '2026-03-05T04:30:00.000Z', 'ea514d62-840f-4136-a7e0-4e47a81b0000', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('038d8710-a17a-4649-9389-e42997012a7c', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', '1000+ Already Registered!', 'Over 1000 participants registered in 3 days! Haven''t registered yet? Do it now before we hit our limit.', '2026-03-08T04:30:00.000Z', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('0198a666-3c1b-477d-9bf9-a11ebdf98d17', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', 'Accommodation Portal Open', 'The accommodation booking portal is now live. Book your hostel room before May 31st. First come, first served!', '2026-03-07T04:30:00.000Z', '5a2cb68f-984c-49c9-b28f-04fda56dd64a', '2026-05-21T11:32:04.003Z', '2026-05-21T11:32:04.003Z'),
    ('faecf3df-5c66-48bf-a4f6-5efc493fd3d0', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', 'DESIGN X – 7-Day Design Bootcamp', 'Whether you''re just starting your design journey or looking to sharpen your existing skills, DESIGN X provides a structured roadmap from fundamentals to professional execution. The sessions are designed to be practical, beginner-friendly, and directly applicable to real-world projects.', '2026-05-31T12:50:00.000Z', '283ee50a-b6fe-4b29-a229-41caee7f7672', '2026-05-31T12:46:55.849Z', '2026-05-31T13:08:17.711Z'),
    ('26fdc936-fb01-4f85-9958-e1351b7eb097', 'c03d7f97-e356-4139-a85a-5e99187aa48f', 'Starlet 5.0 Registration Open Now', 'Check the Events Page for More Details', '2026-06-17T04:40:00.000Z', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', '2026-06-17T04:53:48.581Z', '2026-06-17T05:05:20.273Z')
ON CONFLICT DO NOTHING;

-- AuditLog (190 rows)
INSERT INTO "AuditLog" ("id", "userId", "action", "entity", "entityId", "oldValue", "newValue", "ipAddress", "userAgent", "createdAt") VALUES
    ('9b04a8c1-d0f8-446c-b9c8-109954899823', '327200dd-1b12-43ca-a9e6-9946e748ecf6', 'EMAIL_VERIFICATION_REQUEST', 'User', '327200dd-1b12-43ca-a9e6-9946e748ecf6', NULL, '{"tokenHash":"a0914605ddff893ed4c52568283843ad7671b99ec02e9adaae86e84c3b4463e3"}', NULL, NULL, '2026-05-21T11:46:39.282Z'),
    ('192265aa-de69-4957-bcac-d7f79bab5e72', '327200dd-1b12-43ca-a9e6-9946e748ecf6', 'ORGANIZER_REQUEST', 'User', '327200dd-1b12-43ca-a9e6-9946e748ecf6', NULL, '{"orgName":"Lenient Tree","orgEmail":"lenienttree@gmail.com","eventName":"Design Workshop"}', NULL, NULL, '2026-05-21T11:50:51.407Z'),
    ('8d5d4740-ef1a-4190-8140-36d4ff92ab7c', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'APPROVE_ORGANIZER', 'User', '327200dd-1b12-43ca-a9e6-9946e748ecf6', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21T11:51:41.406Z'),
    ('e84e1b34-76f6-4f70-ae27-3de69922bac9', '327200dd-1b12-43ca-a9e6-9946e748ecf6', 'CREATE', 'Event', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21T11:57:01.072Z'),
    ('9d3c96f2-b46a-4e82-a992-505c96a07198', '327200dd-1b12-43ca-a9e6-9946e748ecf6', 'SUBMIT', 'Event', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21T11:57:22.680Z'),
    ('ea3993db-d880-4816-9a85-89660af72e68', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'APPROVE_EVENT', 'Event', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21T11:58:29.211Z'),
    ('a1f9576f-dedf-4f45-8d9f-162452480ad6', 'cd0ca165-493b-438a-a1e2-affd72026bba', 'REGISTER', 'Registration', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-22T13:32:04.506Z'),
    ('ffb7c0f6-1ea8-43bf-924f-77985ceb0295', '96c2c5d5-76d6-455e-842d-c3e7202db8a4', 'REGISTER', 'Registration', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-25T14:22:04.609Z'),
    ('ebc92176-3718-4942-8ada-a0795fba0acc', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"registrationConfirmed","timestamp":"2026-05-25T19:52:28.561Z"}', NULL, NULL, '2026-05-25T14:22:28.562Z'),
    ('9f7229fc-8a7a-433a-bc49-4c586535e6f2', '311965d1-7f4e-4f4c-95d5-472a073e554f', 'REGISTER', 'Registration', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-26T02:38:22.033Z'),
    ('b0c1ddb5-e112-4378-a6ad-4d94e9575b64', '311965d1-7f4e-4f4c-95d5-472a073e554f', 'REGISTER', 'Registration', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-26T04:38:41.711Z'),
    ('6eb64169-42bf-4ba7-a4e1-c70f1366632d', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"registrationConfirmed","timestamp":"2026-05-26T10:09:04.231Z"}', NULL, NULL, '2026-05-26T04:39:04.232Z'),
    ('4e2c2b68-5214-4729-8fc3-aea6731bb2e9', '156fc25d-c9ff-4fc1-b6d7-f9b1aaee0f2f', 'REGISTER', 'Registration', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0', '2026-05-26T10:56:02.972Z'),
    ('cf04f716-b3a7-4ea1-a88a-79fe07c6ed99', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"registrationConfirmed","timestamp":"2026-05-26T16:26:27.376Z"}', NULL, NULL, '2026-05-26T10:56:27.378Z'),
    ('e6b75f9d-98d4-42a1-aab2-50313e5343cc', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-26T18:00:25.424Z"}', NULL, NULL, '2026-05-26T12:30:25.426Z'),
    ('54d6cf1f-c968-4310-8a89-b1bcc4588757', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-26T18:00:25.501Z"}', NULL, NULL, '2026-05-26T12:30:25.502Z'),
    ('94941d61-6995-4b30-a934-12216001fdf0', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-26T18:00:26.502Z"}', NULL, NULL, '2026-05-26T12:30:26.503Z'),
    ('5f526788-ee3f-4b2d-a928-757d19a63dd6', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-26T18:00:27.504Z"}', NULL, NULL, '2026-05-26T12:30:27.505Z'),
    ('7c05c639-fffc-4e76-8117-ddd17c78c1bf', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-26T18:00:27.502Z"}', NULL, NULL, '2026-05-26T12:30:27.503Z'),
    ('21d013e6-c83e-4e60-8296-94c64e2faf0f', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-26T18:00:29.429Z"}', NULL, NULL, '2026-05-26T12:30:29.430Z'),
    ('7dbe0b04-3415-4e4d-92b5-d538be1300e1', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-27T18:00:24.257Z"}', NULL, NULL, '2026-05-27T12:30:24.262Z'),
    ('23cec175-1fb1-41f7-907f-fb695d117893', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-27T18:00:24.282Z"}', NULL, NULL, '2026-05-27T12:30:24.284Z'),
    ('9572df4e-6ce9-44f8-afe9-d25423c64353', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-27T18:00:25.287Z"}', NULL, NULL, '2026-05-27T12:30:25.288Z'),
    ('079f2cb2-367f-4c07-bf12-ec7a6cd0ca31', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)","template":"streakWarning","timestamp":"2026-05-27T18:00:26.251Z"}', NULL, NULL, '2026-05-27T12:30:26.252Z'),
    ('77e7f051-d23e-4421-bfbf-500ac207356c', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'REGISTER', 'Registration', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-27T14:55:04.041Z'),
    ('7f088037-c7be-483e-89ee-438f535fdbd6', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Registration Confirmed: \"Design workshop\"! 🎟️","timestamp":"2026-05-27T20:25:05.601Z"}', NULL, NULL, '2026-05-27T14:55:05.604Z'),
    ('82e42658-fdcf-4e7e-bf36-4e337b1c4775', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Welcome to LenientTree! 🚀","timestamp":"2026-05-27T20:40:32.062Z"}', NULL, NULL, '2026-05-27T15:10:32.065Z'),
    ('10764631-e872-44c0-b433-350f9a4fc619', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"nobinsijo360t@gmail.com","subject":"Welcome to LenientTree! 🚀","timestamp":"2026-05-28T09:32:50.155Z"}', NULL, NULL, '2026-05-28T04:02:50.156Z'),
    ('04126fb9-f4f9-42d0-87e8-61adb3b865df', 'b64d2934-dc88-448f-9806-fbaafac8ac32', 'REGISTER', 'Registration', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28T09:00:49.528Z'),
    ('b3089d13-1a27-4c0e-9f7a-b18610bb8a92', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Registration Confirmed: \"Design workshop\"! 🎟️","timestamp":"2026-05-28T14:30:53.394Z"}', NULL, NULL, '2026-05-28T09:00:53.395Z'),
    ('995f3b2d-f4e9-4bfa-a4e3-535ee86027f5', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-28T18:00:02.703Z"}', NULL, NULL, '2026-05-28T12:30:02.704Z'),
    ('241c3b1e-5ec9-4476-a47a-88d97ce31b6b', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-28T18:00:02.867Z"}', NULL, NULL, '2026-05-28T12:30:02.868Z'),
    ('48f3e966-8586-402b-a530-941768eedc62', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp007@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-28T18:00:02.873Z"}', NULL, NULL, '2026-05-28T12:30:02.874Z'),
    ('0afe35ec-bdd0-4119-b57b-e3484edaf5d4', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-28T18:00:02.909Z"}', NULL, NULL, '2026-05-28T12:30:02.910Z'),
    ('9e755c87-0e15-418e-a2eb-ed9a87891707', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-29T18:00:03.567Z"}', NULL, NULL, '2026-05-29T12:30:03.572Z'),
    ('fc3bc0eb-e52f-4d96-90aa-9f4a7e253ecc', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-29T18:00:03.596Z"}', NULL, NULL, '2026-05-29T12:30:03.596Z'),
    ('ea72eb9f-6190-4f65-b323-a4990d82e85f', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-29T18:00:03.620Z"}', NULL, NULL, '2026-05-29T12:30:03.622Z'),
    ('1910ef02-824f-4da4-a09c-2157d825360e', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-29T18:00:03.572Z"}', NULL, NULL, '2026-05-29T12:30:03.574Z'),
    ('f7565e40-4a04-4b3e-bdba-06fadc8ef385', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-29T18:00:03.595Z"}', NULL, NULL, '2026-05-29T12:30:03.596Z'),
    ('210805c9-f253-4527-aa29-328caa990913', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-30T18:00:03.481Z"}', NULL, NULL, '2026-05-30T12:30:03.482Z'),
    ('43ff8282-0cce-494c-b5eb-b305da77f73a', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-30T18:00:03.529Z"}', NULL, NULL, '2026-05-30T12:30:03.530Z'),
    ('97939b5d-8efd-43af-acb9-eee34d20b4ea', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-30T18:00:03.533Z"}', NULL, NULL, '2026-05-30T12:30:03.534Z'),
    ('81b762dc-a1b4-4866-81f2-fe8cb70d0474', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-30T18:00:03.485Z"}', NULL, NULL, '2026-05-30T12:30:03.486Z'),
    ('3fa8d110-a278-48a9-9419-968d7314f417', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-30T18:00:03.516Z"}', NULL, NULL, '2026-05-30T12:30:03.517Z'),
    ('ba5ff040-d0bb-4661-924a-6d069c3d2b4c', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustine.lenienttree@gmail.com","subject":"Welcome to LenientTree! 🚀","timestamp":"2026-05-31T08:40:48.433Z"}', NULL, NULL, '2026-05-31T03:10:48.434Z'),
    ('22972b8a-15f1-4f71-b074-84e6c3fc7a7f', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-31T18:00:02.740Z"}', NULL, NULL, '2026-05-31T12:30:02.741Z'),
    ('e6499f84-5f32-4710-b866-9155d99aae38', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-31T18:00:02.848Z"}', NULL, NULL, '2026-05-31T12:30:02.849Z'),
    ('e21863e2-f951-4966-9b41-4fdf85cda6de', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-31T18:00:02.879Z"}', NULL, NULL, '2026-05-31T12:30:02.880Z'),
    ('7e9c681e-5962-4815-a85b-febd105955e0', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-31T18:00:02.781Z"}', NULL, NULL, '2026-05-31T12:30:02.782Z'),
    ('203b8c7c-b216-4db8-bc5a-db5237e209c0', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-05-31T18:00:02.813Z"}', NULL, NULL, '2026-05-31T12:30:02.814Z'),
    ('39dd0f98-c394-412a-8df0-072a37c600ab', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'CREATE', 'Event', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-31T12:46:57.634Z'),
    ('6e76ba5b-fb6e-418e-9b1b-82b4cd1dd111', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Draft Created: \"DESIGN X – 7-Day Design Bootcamp\" 📅","timestamp":"2026-05-31T18:16:59.050Z"}', NULL, NULL, '2026-05-31T12:46:59.051Z'),
    ('f5535694-d425-4f6b-bd55-6c996c4fcc5c', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'SUBMIT', 'Event', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-31T12:48:08.045Z'),
    ('379d6387-0dcf-4bc6-884a-4cab7b760678', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Review Required: Event Approval Needed 🛡️","timestamp":"2026-05-31T18:18:09.431Z"}', NULL, NULL, '2026-05-31T12:48:09.432Z'),
    ('51b9b40f-0a1e-4c30-abfd-72a1e28d4c6a', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'APPROVE_EVENT', 'Event', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-31T12:49:14.037Z'),
    ('e4eb2dce-d5f5-4b4b-b044-d325dcf6ba37', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Approved & Live: \"DESIGN X – 7-Day Design Bootcamp\"! 🟢","timestamp":"2026-05-31T18:19:15.455Z"}', NULL, NULL, '2026-05-31T12:49:15.456Z'),
    ('8e6438c9-838f-4146-bb2d-ff78f229b1ea', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'DELETE', 'Event', 'c603a45b-c141-42f5-8312-0a000d516ab9', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-31T12:50:23.276Z'),
    ('4dccc57d-2f24-4bc4-8bf9-3e89ccb10ea6', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Cancelled: Event \"Design workshop\" 🚫","timestamp":"2026-05-31T18:20:24.660Z"}', NULL, NULL, '2026-05-31T12:50:24.664Z'),
    ('d7e4318e-5b52-4bb4-89b2-1401f6a31814', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Cancelled: Event \"Design workshop\" 🚫","timestamp":"2026-05-31T18:20:26.137Z"}', NULL, NULL, '2026-05-31T12:50:26.141Z'),
    ('c880114a-237b-4823-92b3-903649606f79', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Cancelled: Event \"Design workshop\" 🚫","timestamp":"2026-05-31T18:20:26.821Z"}', NULL, NULL, '2026-05-31T12:50:26.823Z'),
    ('10b2bde1-e676-46d2-8004-a50f1a99f4da', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Cancelled: Event \"Design workshop\" 🚫","timestamp":"2026-05-31T18:20:27.514Z"}', NULL, NULL, '2026-05-31T12:50:27.517Z'),
    ('94ff6b8b-646f-496c-97a8-662227be7942', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Cancelled: Event \"Design workshop\" 🚫","timestamp":"2026-05-31T18:20:28.204Z"}', NULL, NULL, '2026-05-31T12:50:28.207Z'),
    ('2dea94e4-68f0-4cd0-afe4-757a3d1a3324', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp007@gmail.com","subject":"Cancelled: Event \"Design workshop\" 🚫","timestamp":"2026-05-31T18:20:28.867Z"}', NULL, NULL, '2026-05-31T12:50:28.868Z'),
    ('bee0ef10-0c59-4fc2-8ed6-653a0275535f', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'REGISTER', 'Registration', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-31T12:50:53.243Z'),
    ('c9619fb9-83ef-4c89-ac15-ea777a8ad25e', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Registration Confirmed: \"DESIGN X – 7-Day Design Bootcamp\"! 🎟️","timestamp":"2026-05-31T18:20:54.621Z"}', NULL, NULL, '2026-05-31T12:50:54.622Z'),
    ('a186392c-2d44-4ad5-8b61-aba3c8c4253c', '96c2c5d5-76d6-455e-842d-c3e7202db8a4', 'REGISTER', 'Registration', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36', '2026-05-31T13:06:44.427Z'),
    ('240bf642-4ac7-428f-ac58-2aac32bbaad4', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Registration Confirmed: \"DESIGN X – 7-Day Design Bootcamp\"! 🎟️","timestamp":"2026-05-31T18:36:45.938Z"}', NULL, NULL, '2026-05-31T13:06:45.939Z'),
    ('1a405e6b-edc1-4562-8504-d535371d75b0', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Updates to Event: \"DESIGN X – 7-Day Design Bootcamp\" 📢","timestamp":"2026-05-31T18:38:17.955Z"}', NULL, NULL, '2026-05-31T13:08:17.957Z'),
    ('25c528ee-75a5-4d00-9b25-239d52c938a1', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Updates to Event: \"DESIGN X – 7-Day Design Bootcamp\" 📢","timestamp":"2026-05-31T18:38:18.632Z"}', NULL, NULL, '2026-05-31T13:08:18.633Z'),
    ('66549101-7654-41a6-bcf2-f8c551a4ea8f', '2a80e73b-043e-4d27-aeae-7bbeeeac65e6', 'EMAIL_VERIFICATION_REQUEST', 'User', '2a80e73b-043e-4d27-aeae-7bbeeeac65e6', NULL, '{"tokenHash":"97d003993112fd794e77284260e899f806ba64a2f7d1d22376ded67576425ae0"}', NULL, NULL, '2026-05-31T13:31:16.424Z'),
    ('a261bfd8-683f-4fed-aefa-d4037b4cde15', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abc@gmail.com","subject":"Welcome to LenientTree! 🚀","timestamp":"2026-05-31T19:01:17.893Z"}', NULL, NULL, '2026-05-31T13:31:17.894Z'),
    ('648ad300-f8ac-40d7-b089-07702025bc62', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abc@gmail.com","subject":"Verify Your LenientTree Email Address ✉️","timestamp":"2026-05-31T19:01:32.856Z"}', NULL, NULL, '2026-05-31T13:31:32.857Z'),
    ('e5c5fc2e-26d2-4548-91a8-dbb376888412', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'ADMIN_GENERATE_REFERRAL', 'Referral', NULL, NULL, NULL, '127.0.0.1', 'PostmanRuntime/7.51.1', '2026-05-31T13:33:05.059Z'),
    ('fb6fcc89-40a6-421a-8106-bf9333daedc8', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:03.376Z"}', NULL, NULL, '2026-06-01T03:30:03.377Z'),
    ('4f187669-bc1a-4779-9cb9-1c193f6fa30b', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"sneha@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:03.393Z"}', NULL, NULL, '2026-06-01T03:30:03.394Z'),
    ('ac08a3e9-31c3-46a8-814b-4f0602fb97af', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"vikram@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:03.400Z"}', NULL, NULL, '2026-06-01T03:30:03.401Z'),
    ('413c6f10-b5c6-4e6f-a64a-2a381eaed108', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rohan@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:03.420Z"}', NULL, NULL, '2026-06-01T03:30:03.421Z'),
    ('7467c8b6-c32a-4c2a-9449-bd0105d01f5f', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"ananya@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:03.426Z"}', NULL, NULL, '2026-06-01T03:30:03.427Z'),
    ('f9f081cd-9c23-4335-9fed-a6b1b6dfcf54', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.079Z"}', NULL, NULL, '2026-06-01T03:30:04.080Z'),
    ('ded3ad69-a947-4b06-b178-ec7a2f6818d4', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.087Z"}', NULL, NULL, '2026-06-01T03:30:04.088Z'),
    ('19c83351-3a41-46a5-9563-6678a5053782', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.107Z"}', NULL, NULL, '2026-06-01T03:30:04.108Z'),
    ('6a1cd00d-6762-4982-b576-872ada15e24f', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp007@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.117Z"}', NULL, NULL, '2026-06-01T03:30:04.118Z'),
    ('a62e554f-84c6-4d13-96d5-09ce3aa7c964', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abc@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.784Z"}', NULL, NULL, '2026-06-01T03:30:04.785Z'),
    ('a34acf98-2a71-4b2e-8b54-f0c30e8caa73', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"fezinfezsar@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.791Z"}', NULL, NULL, '2026-06-01T03:30:04.792Z'),
    ('ab0f2172-e105-454b-86f4-e917edc52f95', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp000@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.821Z"}', NULL, NULL, '2026-06-01T03:30:04.822Z'),
    ('a9c574dd-4245-4667-b1e8-ab1819a84eb9', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:04.830Z"}', NULL, NULL, '2026-06-01T03:30:04.831Z'),
    ('917d7dd7-0de4-45d4-864d-02ead152a78e', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"meera@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:05.004Z"}', NULL, NULL, '2026-06-01T03:30:05.005Z'),
    ('9ee0a885-e4b9-4d4e-ae0a-4c2d7458a1f5', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"nobinsijo360t@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:05.472Z"}', NULL, NULL, '2026-06-01T03:30:05.473Z'),
    ('7a723be5-303b-4ed8-9fe3-73946208451a', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"christeenajestin7@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:05.491Z"}', NULL, NULL, '2026-06-01T03:30:05.492Z'),
    ('a539d474-7ee6-41c7-90e0-205e95b6da31', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"ravi@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:05.546Z"}', NULL, NULL, '2026-06-01T03:30:05.547Z'),
    ('6512ee15-f65b-4b8a-b9a7-687c503ceca8', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"arjun@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:05.556Z"}', NULL, NULL, '2026-06-01T03:30:05.556Z'),
    ('b626d7bd-901b-4813-8fe3-345fb4f82796', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustine.lenienttree@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:05.697Z"}', NULL, NULL, '2026-06-01T03:30:05.698Z'),
    ('eac82bc2-76bb-41c1-a6d7-138aa67c5498', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulcoder@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:06.152Z"}', NULL, NULL, '2026-06-01T03:30:06.153Z'),
    ('bd5d4799-96a2-40c0-9706-fe9b1866fac6', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"priya@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:06.158Z"}', NULL, NULL, '2026-06-01T03:30:06.159Z'),
    ('2f1995fb-4a50-42b3-af41-f03c27b8fca8', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"jeebloom232@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:06.228Z"}', NULL, NULL, '2026-06-01T03:30:06.229Z'),
    ('b212cf6d-0897-45d3-a040-8b169d7129be', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"malavikagopi777@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-01T09:00:06.233Z"}', NULL, NULL, '2026-06-01T03:30:06.234Z'),
    ('e9b7461d-7f59-422c-88f4-9f9781db7619', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Weekly Platform Metrics Report 📈","timestamp":"2026-06-01T09:00:06.432Z"}', NULL, NULL, '2026-06-01T03:30:06.433Z'),
    ('cb831a7a-3f71-408e-bdd6-ca42eb3df3a7', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Welcome to LenientTree! 🚀","timestamp":"2026-06-01T10:00:04.921Z"}', NULL, NULL, '2026-06-01T04:30:04.922Z'),
    ('00283e56-8b29-428d-a481-ec7893d01ae9', '039807ef-1bad-4f32-939e-a4da514fc773', 'REGISTER', 'Registration', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36', '2026-06-01T04:31:00.035Z'),
    ('b6ea485f-8266-4835-812f-6165033832a8', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Message failed: 554 5.7.1 Disabled by user from hPanel","template":"registrationConfirmed","timestamp":"2026-06-01T10:01:19.598Z"}', NULL, NULL, '2026-06-01T04:31:19.599Z'),
    ('e588c727-fb4e-447b-9a7d-40e8b2dc5e30', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Message failed: 554 5.7.1 Disabled by user from hPanel","template":"streakWarning","timestamp":"2026-06-01T18:00:20.911Z"}', NULL, NULL, '2026-06-01T12:30:20.913Z'),
    ('4d97c4c5-0239-4fb6-8fc6-17561ac90277', NULL, 'EMAIL_TEMPLATE_FAILURE', 'System', NULL, NULL, '{"error":"Message failed: 554 5.7.1 Disabled by user from hPanel","template":"streakWarning","timestamp":"2026-06-01T18:00:21.453Z"}', NULL, NULL, '2026-06-01T12:30:21.454Z'),
    ('a8e36e88-8669-4e49-bda0-4b653fd0945e', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-02T18:00:03.295Z"}', NULL, NULL, '2026-06-02T12:30:03.301Z'),
    ('0b9beaee-7cf3-4687-8e0b-0420a2cd8443', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-02T18:00:03.448Z"}', NULL, NULL, '2026-06-02T12:30:03.449Z'),
    ('531283ab-2bae-46f5-b72b-d3a9ec26f5f2', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-02T18:00:03.360Z"}', NULL, NULL, '2026-06-02T12:30:03.361Z'),
    ('2c5fd66d-7645-42e9-a7f6-ba50b34cd0da', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-02T18:00:03.486Z"}', NULL, NULL, '2026-06-02T12:30:03.487Z'),
    ('0e646c9b-baeb-4ec5-870a-a99637966111', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-03T18:00:03.341Z"}', NULL, NULL, '2026-06-03T12:30:03.342Z'),
    ('821534af-11b5-46be-b341-2a90a7b2a468', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-03T18:00:03.348Z"}', NULL, NULL, '2026-06-03T12:30:03.349Z'),
    ('b31268ac-d930-44fb-b04d-28da29698c18', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-03T18:00:03.352Z"}', NULL, NULL, '2026-06-03T12:30:03.353Z'),
    ('a36fd809-ef4c-41b0-8df0-7cacad6b34ad', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-04T18:00:03.104Z"}', NULL, NULL, '2026-06-04T12:30:03.108Z'),
    ('b6a1ac8a-1c28-43d5-98ee-ed909e84f7e5', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-04T18:00:03.308Z"}', NULL, NULL, '2026-06-04T12:30:03.309Z'),
    ('f437a91e-db97-4215-9ffa-5e729ea5c154', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-04T18:00:03.480Z"}', NULL, NULL, '2026-06-04T12:30:03.481Z'),
    ('e198a223-e9af-462b-a051-6cc3fbc7da06', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-05T18:00:03.333Z"}', NULL, NULL, '2026-06-05T12:30:03.341Z'),
    ('efadab8c-2c04-471f-b5e7-4370b8ffdcb2', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-05T18:00:03.714Z"}', NULL, NULL, '2026-06-05T12:30:03.715Z'),
    ('01a88be1-99eb-49d2-9105-aad696692a45', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-05T18:00:03.343Z"}', NULL, NULL, '2026-06-05T12:30:03.344Z'),
    ('3f7a1f09-914e-4862-b13c-95aa292b6b15', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-06T18:00:02.821Z"}', NULL, NULL, '2026-06-06T12:30:02.823Z'),
    ('4a882768-8e06-4950-9d7e-fc0404f07802', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-06T18:00:02.843Z"}', NULL, NULL, '2026-06-06T12:30:02.844Z'),
    ('d778e3f2-a65f-4679-84c5-982dc6c21906', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Save Your active streak! 🔥","timestamp":"2026-06-06T18:00:02.936Z"}', NULL, NULL, '2026-06-06T12:30:02.937Z'),
    ('92acfe9c-64dc-42a9-8e0c-f6e00b5c9cb1', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:04.396Z"}', NULL, NULL, '2026-06-08T03:30:04.397Z'),
    ('3dc80e4d-3bfe-4837-b8a6-df1b2212d699', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"ananya@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:04.390Z"}', NULL, NULL, '2026-06-08T03:30:04.396Z'),
    ('bd2797b6-0250-42a3-971b-a41f497a6e6a', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:04.396Z"}', NULL, NULL, '2026-06-08T03:30:04.397Z'),
    ('bf9c142f-0f12-4ecb-bd0b-404c440edbe9', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:05.275Z"}', NULL, NULL, '2026-06-08T03:30:05.276Z'),
    ('968ac3dd-c86e-4711-9290-492e98d865a3', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:05.292Z"}', NULL, NULL, '2026-06-08T03:30:05.293Z'),
    ('778d53dc-64dd-461b-b211-be3424fcf779', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"vikram@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:05.319Z"}', NULL, NULL, '2026-06-08T03:30:05.320Z'),
    ('4aa82da2-61be-4e4b-b557-a2f56c39081e', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:06.162Z"}', NULL, NULL, '2026-06-08T03:30:06.163Z'),
    ('4a04e998-9c80-4e96-8324-b777a3d570fb', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp007@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:06.612Z"}', NULL, NULL, '2026-06-08T03:30:06.613Z'),
    ('a790c06d-eb3f-48c5-891e-059296ecedb8', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:06.634Z"}', NULL, NULL, '2026-06-08T03:30:06.635Z'),
    ('a9a9bfa3-0049-47a7-a10e-b9977e2c1c7d', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"meera@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:06.883Z"}', NULL, NULL, '2026-06-08T03:30:06.884Z'),
    ('2162f6e1-d1a4-4340-916c-4f671c9b237f', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"fezinfezsar@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:07.292Z"}', NULL, NULL, '2026-06-08T03:30:07.293Z'),
    ('e6026f30-1834-4981-a477-75b9ed40222a', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abc@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:07.321Z"}', NULL, NULL, '2026-06-08T03:30:07.322Z'),
    ('5592ceae-6b03-46bd-9f2b-f53d28579266', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp000@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:07.612Z"}', NULL, NULL, '2026-06-08T03:30:07.613Z'),
    ('5c14d0b1-9274-4724-b486-2ad4e6db8b5e', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"christeenajestin7@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:08.039Z"}', NULL, NULL, '2026-06-08T03:30:08.040Z'),
    ('a94044a8-115a-4ef3-b210-41bf7949390c', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustine.lenienttree@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:08.757Z"}', NULL, NULL, '2026-06-08T03:30:08.758Z'),
    ('32f9c5d4-5d97-4639-9db4-fad31467fc5a', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulcoder@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:09.316Z"}', NULL, NULL, '2026-06-08T03:30:09.317Z'),
    ('a9c3edcb-c8b0-405c-aaeb-3da39e4e7671', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"priya@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:09.422Z"}', NULL, NULL, '2026-06-08T03:30:09.423Z'),
    ('5bf5d1ff-0e51-47fc-a867-4058ff704dc0', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"nobinsijo360t@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:08.078Z"}', NULL, NULL, '2026-06-08T03:30:08.079Z'),
    ('5090feec-75f8-4678-a269-e1628b886946', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"ravi@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:08.317Z"}', NULL, NULL, '2026-06-08T03:30:08.318Z'),
    ('0c17cfbf-de68-4560-b260-b1f33a5906c4', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"arjun@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:08.754Z"}', NULL, NULL, '2026-06-08T03:30:08.755Z'),
    ('42a815cc-3d14-4f54-8a56-c13716ba732c', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"jeebloom232@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:09.445Z"}', NULL, NULL, '2026-06-08T03:30:09.446Z'),
    ('962867d7-7355-4ca1-a7bf-f9b9ec8d4f90', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"malavikagopi777@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:09.982Z"}', NULL, NULL, '2026-06-08T03:30:09.983Z'),
    ('cb502684-4c89-4f04-b65e-1e5c96c3f61c', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Weekly Platform Metrics Report 📈","timestamp":"2026-06-08T09:00:10.215Z"}', NULL, NULL, '2026-06-08T03:30:10.216Z'),
    ('b388dec5-ff97-4c4f-a24a-b722dd31fbf6', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rohan@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:14.296Z"}', NULL, NULL, '2026-06-08T03:30:14.297Z'),
    ('f25a2556-e8dc-4973-b8e9-e80ccedf226f', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"sneha@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-08T09:00:14.617Z"}', NULL, NULL, '2026-06-08T03:30:14.618Z'),
    ('1cd5a37e-8efb-4b6f-b183-29013e323ccf', 'bce2b765-6261-4fdb-9fbc-8044b41c8dee', 'EMAIL_VERIFICATION_REQUEST', 'User', 'bce2b765-6261-4fdb-9fbc-8044b41c8dee', NULL, '{"tokenHash":"a183909fc669d7eb899632511336f61ff53925e73153d307742b36ff09a56a20"}', NULL, NULL, '2026-06-13T02:19:15.971Z'),
    ('4daffc1c-9262-445d-8e0f-cfa2a1cb2150', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abirambijoy@gmail.com","subject":"Verify Your LenientTree Email Address ✉️","timestamp":"2026-06-13T07:49:17.485Z"}', NULL, NULL, '2026-06-13T02:19:17.487Z'),
    ('a3fadd27-c041-4674-aef9-18cb30006c86', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abirambijoy@gmail.com","subject":"Welcome to LenientTree! 🚀","timestamp":"2026-06-13T07:49:17.490Z"}', NULL, NULL, '2026-06-13T02:19:17.491Z'),
    ('c5328b1b-7741-4c0f-9699-a2bbca299987', 'bce2b765-6261-4fdb-9fbc-8044b41c8dee', 'ORGANIZER_REQUEST', 'User', 'bce2b765-6261-4fdb-9fbc-8044b41c8dee', NULL, '{"orgName":"Mind Empowered","orgEmail":"team@mind-empowered.org","eventName":"Starlet"}', NULL, NULL, '2026-06-13T02:20:06.818Z'),
    ('236cdcf7-0b97-4f29-876e-d07303782c81', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Review Required: Event Approval Needed 🛡️","timestamp":"2026-06-13T07:50:08.661Z"}', NULL, NULL, '2026-06-13T02:20:08.662Z'),
    ('d93d0067-4d01-43c5-a585-dffa303ca2f2', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"christeenajestin7@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:03.617Z"}', NULL, NULL, '2026-06-15T03:30:03.619Z'),
    ('84cfe5d7-933b-4993-b650-1ac4c0fced46', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"aleenamsiju@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:03.630Z"}', NULL, NULL, '2026-06-15T03:30:03.631Z'),
    ('fb428142-735a-487f-b066-7e1a468f61eb', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rohan@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:03.716Z"}', NULL, NULL, '2026-06-15T03:30:03.717Z'),
    ('7b6da439-7415-4840-9052-c6459aedd1a0', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:04.305Z"}', NULL, NULL, '2026-06-15T03:30:04.306Z'),
    ('d0afa7c3-b0fe-4143-8188-54af10f56da5', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abc@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:04.310Z"}', NULL, NULL, '2026-06-15T03:30:04.311Z'),
    ('db666d00-963e-45ca-9298-9858811509f8', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"arjun@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:04.565Z"}', NULL, NULL, '2026-06-15T03:30:04.566Z'),
    ('a7617338-ab0a-4f3c-9170-af7f0b6a6e76', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumcherry@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:04.995Z"}', NULL, NULL, '2026-06-15T03:30:04.996Z'),
    ('d31e1b9a-c22e-4700-8c5f-26e1304cf176', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"ananya@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:05.240Z"}', NULL, NULL, '2026-06-15T03:30:05.241Z'),
    ('6aa1576a-3050-4106-9a76-1ee2c0ce893c', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"nobinsijo360t@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:05.242Z"}', NULL, NULL, '2026-06-15T03:30:05.244Z'),
    ('e6cb0441-1922-4874-9e5d-fd558901cdb3', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp000@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:05.263Z"}', NULL, NULL, '2026-06-15T03:30:05.264Z'),
    ('d779587e-b5e1-4cbb-b18c-16a58b246a70', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulcoder@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:05.696Z"}', NULL, NULL, '2026-06-15T03:30:05.697Z'),
    ('eab84611-aec5-4d8d-b56c-253831e49a63', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"priya@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:05.912Z"}', NULL, NULL, '2026-06-15T03:30:05.913Z'),
    ('cc4f6523-7820-44e2-b755-931fed3798b7', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"fezinfezsar@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:05.949Z"}', NULL, NULL, '2026-06-15T03:30:05.952Z'),
    ('1ef7037b-9144-4482-965c-f7257331c0c8', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"jeebloom232@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:05.958Z"}', NULL, NULL, '2026-06-15T03:30:05.959Z'),
    ('e08256c6-2978-43d3-9978-17ef21d9350a', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:06.603Z"}', NULL, NULL, '2026-06-15T03:30:06.604Z'),
    ('96adf157-d4b6-4161-aa81-197aa52c1eec', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"malavikagopi777@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:06.640Z"}', NULL, NULL, '2026-06-15T03:30:06.641Z'),
    ('e451395f-bf75-4939-bf7d-2545d2ee1639', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"studyjams4@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:06.670Z"}', NULL, NULL, '2026-06-15T03:30:06.671Z'),
    ('0131ade3-f9b4-4c02-9bdb-b99b61e1d729', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"sneha@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:06.752Z"}', NULL, NULL, '2026-06-15T03:30:06.753Z'),
    ('1c6b0b52-8200-4bbf-9271-b7aa02152702', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abirambijoy@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:07.318Z"}', NULL, NULL, '2026-06-15T03:30:07.318Z'),
    ('8e2489e1-36a6-4932-a1de-5f8ba30928ff', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"adithkp007@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:07.320Z"}', NULL, NULL, '2026-06-15T03:30:07.320Z'),
    ('7d9e4451-fa86-497a-8b5c-9b9ba41d7d8d', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"vikram@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:07.452Z"}', NULL, NULL, '2026-06-15T03:30:07.453Z'),
    ('4e389300-956b-4fbb-9707-ea36a0785dfb', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"meera@student.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:07.483Z"}', NULL, NULL, '2026-06-15T03:30:07.484Z'),
    ('1782b285-c4ac-46aa-ae37-464667090f04', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"ravi@organizer.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:08.025Z"}', NULL, NULL, '2026-06-15T03:30:08.026Z'),
    ('2d243611-0aa9-4ec9-80ad-b6dd40a05f7d', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Weekly Platform Metrics Report 📈","timestamp":"2026-06-15T09:00:08.138Z"}', NULL, NULL, '2026-06-15T03:30:08.138Z'),
    ('b228b592-0220-4724-886b-8c200525a6e6', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustine.lenienttree@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:08.169Z"}', NULL, NULL, '2026-06-15T03:30:08.170Z'),
    ('b41825cc-5866-4d0f-b531-54b2a026ddb4', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"angithananya@gmail.com","subject":"Weekly Leaderboard Digest 📊","timestamp":"2026-06-15T09:00:09.428Z"}', NULL, NULL, '2026-06-15T03:30:09.429Z'),
    ('c1379012-d92f-4a43-b0e5-26f702329547', 'ea32cb3f-8beb-4b90-9e88-c555ac306024', 'EMAIL_VERIFICATION_REQUEST', 'User', 'ea32cb3f-8beb-4b90-9e88-c555ac306024', NULL, '{"tokenHash":"7cfe9af62fe4b6eed1fedc4c915165c78628a5e17fc7208a2688bb3e68f165a1"}', NULL, NULL, '2026-06-15T10:35:38.172Z'),
    ('768ffac3-2de9-4b17-baf4-c21db31759af', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', 'APPROVE_ORGANIZER', 'User', 'bce2b765-6261-4fdb-9fbc-8044b41c8dee', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-15T14:07:58.129Z'),
    ('646f7a05-3d7b-4aba-87d9-558342d3b31d', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"abirambijoy@gmail.com","subject":"Organizer Studio Request: Approved 🛡","timestamp":"2026-06-15T19:38:06.220Z"}', NULL, NULL, '2026-06-15T14:08:06.221Z'),
    ('aee6dd9b-564a-4586-893c-a164fcafb1df', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', 'CREATE', 'Event', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17T04:53:50.316Z'),
    ('2c240171-f2fb-4aae-bc4c-029ef6395bc5', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumchery@lenienttree.com","subject":"Draft Created: \"Starlet 5.0\" 📅","timestamp":"2026-06-17T10:23:51.900Z"}', NULL, NULL, '2026-06-17T04:53:51.901Z'),
    ('a2336999-b96a-456e-b626-ba8005e33d60', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', 'SUBMIT', 'Event', 'c03d7f97-e356-4139-a85a-5e99187aa48f', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17T04:58:14.367Z'),
    ('3e15c87e-0797-4f35-be32-e6b752730e6a', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumchery@lenienttree.com","subject":"Review Required: Event Approval Needed 🛡️","timestamp":"2026-06-17T10:28:15.769Z"}', NULL, NULL, '2026-06-17T04:58:15.770Z'),
    ('685a576a-a7f2-4924-9a41-cbfa59cb39ec', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"admin@lenienttree.com","subject":"Review Required: Event Approval Needed 🛡️","timestamp":"2026-06-17T10:28:15.964Z"}', NULL, NULL, '2026-06-17T04:58:15.965Z'),
    ('771b0daa-7c22-4cc9-be31-8241beac777d', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', 'APPROVE_EVENT', 'Event', 'c03d7f97-e356-4139-a85a-5e99187aa48f', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17T05:07:01.347Z'),
    ('7acfeabc-e804-4f5d-863f-19260e98491d', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumchery@lenienttree.com","subject":"Approved & Live: \"Starlet 5.0\"! 🟢","timestamp":"2026-06-17T10:37:02.862Z"}', NULL, NULL, '2026-06-17T05:07:02.863Z'),
    ('7761b5a3-43e1-4df8-8f43-0fc5c8434b96', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', 'REGISTER', 'Registration', 'c03d7f97-e356-4139-a85a-5e99187aa48f', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17T05:08:26.934Z'),
    ('7c8c5045-7570-4d4b-82f5-9c1daa23ca98', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumchery@lenienttree.com","subject":"Registration Confirmed: \"Starlet 5.0\"! 🎟️","timestamp":"2026-06-17T10:38:28.426Z"}', NULL, NULL, '2026-06-17T05:08:28.427Z'),
    ('8c4a1714-1264-4b4d-baf1-83ebe00cc25a', '96c2c5d5-76d6-455e-842d-c3e7202db8a4', 'REGISTER', 'Registration', 'c03d7f97-e356-4139-a85a-5e99187aa48f', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17T05:09:22.327Z'),
    ('7b7ff770-89cf-4f6d-bcef-2f2ed6497e6b', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Registration Confirmed: \"Starlet 5.0\"! 🎟️","timestamp":"2026-06-17T10:39:23.735Z"}', NULL, NULL, '2026-06-17T05:09:23.736Z'),
    ('731438c1-2fc0-4e0c-b20d-7bcd35c0086e', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"rprahulofficial07@gmail.com","subject":"Updates to Event: \"Starlet 5.0\" 📢","timestamp":"2026-06-17T10:41:35.777Z"}', NULL, NULL, '2026-06-17T05:11:35.779Z'),
    ('3e2b0dbc-70e8-4eb4-a5a6-b0524503d6c6', NULL, 'EMAIL_DISPATCHED', 'Email', NULL, NULL, '{"to":"augustinevadakumchery@lenienttree.com","subject":"Updates to Event: \"Starlet 5.0\" 📢","timestamp":"2026-06-17T10:41:36.466Z"}', NULL, NULL, '2026-06-17T05:11:36.467Z')
ON CONFLICT DO NOTHING;

-- Bookmark (13 rows)
INSERT INTO "Bookmark" ("id", "userId", "eventId", "createdAt") VALUES
    ('f4974b38-afaf-4418-9710-be034954a6c9', '35de982a-90a8-442f-8159-9226ed318d25', 'a824decf-1fc3-446e-b5ba-6b0270d15c7f', '2026-05-21T11:32:05.054Z'),
    ('9e52afb3-0051-407b-af16-0ee178ff4c33', '35de982a-90a8-442f-8159-9226ed318d25', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', '2026-05-21T11:32:05.054Z'),
    ('b3e15cfa-ae2b-4757-bd81-76258f6324b1', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', '19965872-44b5-4f77-b319-9dbb0ddba02a', '2026-05-21T11:32:05.054Z'),
    ('3065611c-d277-4629-8b31-52dcf29b6ab9', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', '2026-05-21T11:32:05.054Z'),
    ('62730a74-e622-4f8e-b2c9-3f91f585a050', 'b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', '2026-05-21T11:32:05.054Z'),
    ('94317d54-a3bc-4d39-bbff-a1a8ce20dcb7', 'b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', '2026-05-21T11:32:05.054Z'),
    ('e1e84081-dfbc-4b76-9491-c3b07332ad1a', 'dd1b806d-cd1c-4775-a63d-ab05132c4654', '19965872-44b5-4f77-b319-9dbb0ddba02a', '2026-05-21T11:32:05.054Z'),
    ('6d8aa9c7-e4db-41aa-b363-eada3dbd0b11', 'd3fdaf66-ffeb-438a-919e-073c85afee5c', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', '2026-05-21T11:32:05.054Z'),
    ('30a4f655-a69d-4406-98e7-0ed02f072265', 'd3fdaf66-ffeb-438a-919e-073c85afee5c', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', '2026-05-21T11:32:05.054Z'),
    ('660e79a7-ea45-4171-a3d7-9e307de1d172', '311965d1-7f4e-4f4c-95d5-472a073e554f', 'c603a45b-c141-42f5-8312-0a000d516ab9', '2026-05-26T04:39:56.207Z'),
    ('27da4b84-e6e6-4646-93bc-a1772cb3fe9b', '156fc25d-c9ff-4fc1-b6d7-f9b1aaee0f2f', 'c603a45b-c141-42f5-8312-0a000d516ab9', '2026-05-26T10:59:09.128Z'),
    ('7b8a76d7-8f73-4aab-a3e7-d3379c229d62', '22519cb3-4000-4a8d-89c3-c1ee619198a1', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', '2026-05-26T11:32:18.303Z'),
    ('2cba2b04-d569-4dc6-aa10-4acc8f63a743', '283ee50a-b6fe-4b29-a229-41caee7f7672', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', '2026-05-31T12:51:40.708Z')
ON CONFLICT DO NOTHING;

-- Certificate (3 rows)
INSERT INTO "Certificate" ("id", "userId", "eventId", "certificateUrl", "issuedAt") VALUES
    ('694d4201-4b70-4992-89a3-03c0d6f7eb5f', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'https://lenienttree.com/certs/ai-webinar-rohan.pdf', '2026-03-25T14:30:00.000Z'),
    ('81fa8722-939b-42ee-acfe-70be257857d4', 'b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'https://lenienttree.com/certs/ai-webinar-sneha.pdf', '2026-03-25T14:30:00.000Z'),
    ('f2956589-0eb8-42ad-ab15-00a4ac227e6d', 'd3fdaf66-ffeb-438a-919e-073c85afee5c', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'https://lenienttree.com/certs/ai-webinar-meera.pdf', '2026-03-25T14:30:00.000Z')
ON CONFLICT DO NOTHING;

-- Event (8 rows)
INSERT INTO "Event" ("id", "title", "subtitle", "category", "theme", "organizerId", "mode", "venueName", "address", "mapLink", "startDate", "endDate", "registrationDeadline", "bannerImage", "eventPoster", "description", "prizeType", "prizeAmount", "maxParticipants", "approvalMode", "status", "isPaid", "registrationType", "minTeamSize", "maxTeamSize", "ticketPrice", "paymentType", "upiId", "upiQrCode", "primaryColor", "secondaryColor", "accentColor", "customFormFields", "rejectionReason", "isFeatured", "isPremium", "createdAt", "updatedAt", "deletedAt") VALUES
    ('19965872-44b5-4f77-b319-9dbb0ddba02a', 'LenientHack 2026', 'Build. Break. Innovate.', 'Hackathon', NULL, '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', 'ONLINE', NULL, NULL, NULL, '2026-04-15T03:30:00.000Z', '2026-04-17T12:30:00.000Z', '2026-04-10T18:29:59.000Z', NULL, NULL, 'LenientHack 2026 is a 48-hour online hackathon open to all engineering students across India.

Build impactful products, win cash prizes, and get recognized by top tech companies.

Topics: AI/ML, Web3, HealthTech, EdTech, FinTech.
Team size: 2–4 members.', 'CASH', 100000, 500, 'AUTO', 'APPROVED', FALSE, 'INDIVIDUAL', NULL, NULL, NULL, 'FREE', NULL, NULL, '#00ff88', '#0a1f1f', '#f43f5e', '[{"type":"text","label":"GitHub Profile URL","required":true},{"type":"text","label":"Team Name","required":true},{"type":"select","label":"Problem Statement Interest","options":["AI/ML","Web3","HealthTech","EdTech","FinTech"],"required":false}]', NULL, TRUE, FALSE, '2026-05-21T11:32:03.169Z', '2026-05-21T11:32:03.169Z', NULL),
    ('aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', 'NextGen Ideathon 2026', 'Ideas that change the world', 'Ideathon', NULL, '5a2cb68f-984c-49c9-b28f-04fda56dd64a', 'OFFLINE', 'Innovation Hub, IIT Madras Research Park', 'IIT Madras Research Park, Kanagam Road, Taramani, Chennai - 600113', NULL, '2026-05-01T04:30:00.000Z', '2026-05-02T11:30:00.000Z', '2026-04-25T18:29:59.000Z', NULL, NULL, 'NextGen Ideathon is an offline idea competition where students present their startup ideas to a panel of VCs and industry experts.

Shortlisted ideas get incubation support worth ₹5 lakh.

Domain: Sustainability, Healthcare, Smart Cities.
Open to all undergraduates.', 'CASH', 50000, 200, 'MANUAL', 'APPROVED', FALSE, 'INDIVIDUAL', NULL, NULL, NULL, 'FREE', NULL, NULL, '#6366f1', '#1e293b', '#f59e0b', NULL, NULL, TRUE, FALSE, '2026-05-21T11:32:03.302Z', '2026-05-21T11:32:03.302Z', NULL),
    ('a824decf-1fc3-446e-b5ba-6b0270d15c7f', 'CyberSec Conclave 2026', 'Ethical Hacking & Pen-Testing Deep Dive', 'Conclave', NULL, 'ea514d62-840f-4136-a7e0-4e47a81b0000', 'ONLINE', NULL, NULL, NULL, '2026-04-20T08:30:00.000Z', '2026-04-20T12:30:00.000Z', '2026-04-18T18:29:59.000Z', NULL, NULL, 'A 4-hour online conclave featuring cybersecurity experts from CERT-In, HackerOne, and DRDO.

Topics: Penetration Testing, Social Engineering, OWASP Top 10, CTF challenges.
Certificate of participation provided to all.', 'MERCH', NULL, 1000, 'AUTO', 'APPROVED', FALSE, 'INDIVIDUAL', NULL, NULL, NULL, 'FREE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, '2026-05-21T11:32:03.412Z', '2026-05-21T11:32:03.412Z', NULL),
    ('638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'AI in Healthcare Webinar', 'How ML is transforming medicine', 'Webinar', NULL, '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', 'ONLINE', NULL, NULL, NULL, '2026-03-25T10:30:00.000Z', '2026-03-25T12:30:00.000Z', '2026-03-24T18:29:59.000Z', NULL, NULL, 'Join leading AI researchers and healthcare professionals discussing how machine learning is revolutionizing diagnostics, drug discovery, and patient care.

Speakers from AIIMS, Apollo Hospitals, and Microsoft Research.
Q&A session included.', 'NONE', NULL, 2000, 'AUTO', 'APPROVED', FALSE, 'INDIVIDUAL', NULL, NULL, NULL, 'FREE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, '2026-05-21T11:32:03.533Z', '2026-05-21T11:32:03.533Z', NULL),
    ('c6a74ffe-3dce-4951-97fb-e0afe791f451', 'CodeClash Championship', 'Battle of the Best Coders', 'Hackathon', NULL, '5a2cb68f-984c-49c9-b28f-04fda56dd64a', 'OFFLINE', 'Birla Institute of Technology, Pilani', 'Vidya Vihar, Pilani, Rajasthan - 333031', NULL, '2026-06-10T03:30:00.000Z', '2026-06-11T14:30:00.000Z', '2026-06-01T18:29:59.000Z', NULL, NULL, 'CodeClash is a 30-hour competitive programming championship held at BITS Pilani campus.

Teams of 2 face off in algorithmic problem-solving rounds judged in real-time.

Languages: C++, Python, Java.
Accommodation provided for outstation teams.', 'CASH', 75000, 300, 'MANUAL', 'APPROVED', FALSE, 'INDIVIDUAL', NULL, NULL, NULL, 'FREE', NULL, NULL, '#ec4899', '#111827', '#10b981', NULL, NULL, TRUE, FALSE, '2026-05-21T11:32:03.605Z', '2026-05-21T11:32:03.605Z', NULL),
    ('68317ed1-0660-41f8-b308-cd9e1fd60a4e', 'DESIGN X – 7-Day Design Bootcamp', 'From Design Thinking to Portfolio Monetization', 'Webinar', 'UI/UX', '283ee50a-b6fe-4b29-a229-41caee7f7672', 'ONLINE', NULL, NULL, NULL, '2026-06-01T02:30:00.000Z', '2026-06-07T02:30:00.000Z', '2026-06-06T02:30:00.000Z', 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/banners/1780251487120-349781722', 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/posters/1780251417876-418726146', 'DESIGN X – 7-Day Design Bootcamp

From Design Thinking to Portfolio Monetization

DESIGN X is a 7-day online bootcamp designed for students, aspiring designers, freelancers, creators, and professionals looking to build practical design skills and grow their careers.

Learn Design Thinking, Canva, Design Fundamentals, Figma, Branding, Real-World Project Execution, and Portfolio Building from experienced industry professionals.

What You''ll Gain:

• Design Thinking & Problem Solving
• Canva & Figma Skills
• Branding Knowledge
• Hands-On Project Experience
• Portfolio Development
• Freelancing & Monetization Insights
• Certificate of Participation

Mode: Online
Duration: 7 Days

Learn. Design. Build. Monetize.
', 'NONE', 0, NULL, 'AUTO', 'APPROVED', FALSE, 'INDIVIDUAL', NULL, NULL, NULL, 'FREE', NULL, NULL, '#0a1f1f', '#0d2f2f', '#00ff88', '[{"type":"text","label":"name","required":true},{"type":"text","label":"phone","required":true},{"type":"text","label":"email","required":true},{"type":"text","label":"college","required":true}]', NULL, FALSE, FALSE, '2026-05-31T12:46:55.849Z', '2026-05-31T13:08:15.807Z', NULL),
    ('c603a45b-c141-42f5-8312-0a000d516ab9', 'Design workshop', 'Design to Implementation', 'Webinar', 'Design Thinking in 60 mins', '327200dd-1b12-43ca-a9e6-9946e748ecf6', 'ONLINE', NULL, NULL, NULL, '2026-05-30T03:30:00.000Z', '2026-06-01T03:30:00.000Z', '2026-05-30T03:30:00.000Z', 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/banners/1779384441360-211943996', 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/posters/1779470289194-711556777', '
Ray Podder is a designer, strategist, and systems architect, and the creator of the O Protocol and Oconomy—a new framework for more democratic, outcome-focused, and regenerative value exchange. His work brings systems-level clarity to design, turning complexity into more empowering models for participation, coordination, and real-world impact.

📅 *DESIGN X — 7 DAY SCHEDULE*

━━━━━━━━━━━━━━━━━

🎯 DAY 1
Design Thinking
👤 Ray Podder
🔗 https://shorturl.at/y1cLf

🎯 DAY 2
Canva Like a Pro
👤 Pranav
🔗 https://shorturl.at/SoNwU

🎯 DAY 3
Design Fundamentals

🎯 DAY 4
Figma Core Skills
👤 Arnav

🎯 DAY 5
Branding Basics
👤 Akhil B Xavier
🔗 https://shorturl.at/OdXMH

🎯 DAY 6
Real-World Design Project
👤 Akhil S Kumar
🔗 https://shorturl.at/5gutK

🎯 DAY 7
Portfolio Building & Monetization
👤 Pranav
🔗 https://shorturl.at/SoNwU

━━━━━━━━━━━━━━━━━

Built & delivered by industry professionals 🚀', 'NONE', 0, NULL, 'AUTO', 'APPROVED', FALSE, 'INDIVIDUAL', NULL, NULL, NULL, 'FREE', NULL, NULL, '#0a1f1f', '#0d2f2f', '#00ff88', '[{"type":"text","label":"name","required":true},{"type":"text","label":"phone","required":true},{"type":"text","label":"email","required":true},{"type":"number","label":"Year of passout","required":true}]', NULL, FALSE, TRUE, '2026-05-21T11:56:59.206Z', '2026-05-31T12:50:22.558Z', '2026-05-31T12:50:22.557Z'),
    ('c03d7f97-e356-4139-a85a-5e99187aa48f', 'Starlet 5.0', 'Girls Only Hackathon', 'Hackathon', 'Assistive Technology', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', 'OFFLINE', NULL, NULL, 'https://maps.app.goo.gl/CnLDXLpaD7pdHWvu8?g_st=ac', '2026-07-10T16:00:00.000Z', '2026-07-11T16:00:00.000Z', '2026-06-29T16:00:00.000Z', 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/banners/1781692091756-367194554', 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/posters/1781691832071-85766224', '🚀 Starlet 5.0 – Assistive Technology Hackathon

Collaboration over Competition 🤝

Starlet 5.0 is a two-day assistive technology hackathon focused on creating innovative solutions that empower people with disabilities, improve accessibility, and build a more inclusive world. Whether through software, hardware, or AI, participants will work together to develop technologies that break down barriers and promote independence.

📅 Dates
July 11 & 12

🎯 Theme
Collaboration over Competition

🔍 Focus Areas
• Autism support systems
• Deaf education and communication tools
• Accessible learning platforms
• Public accessibility solutions
• Navigation for visually impaired individuals
• Emergency communication systems
• Legal advocacy technologies
• Parent and caregiver support tools
• Sensory overload management
• Open innovation in assistive technology

Participants may also propose their own assistive technology ideas aligned with the event theme.

👥 Team Size
3–4 members per team
Solo participants are welcome and will be assisted in forming teams.

🛠 Event Flow

Day 1
• Kickoff and briefing
• Ideation and problem solving
• UI/UX design
• Development and prototyping

Day 2
• Final development sprint
• Project submission
• Pitch presentations
• Judging and results

🏆 Prizes
🥇 1st Place – ₹15,000
🥈 2nd Place – ₹10,000
🥉 3rd Place – ₹7,500
💡 Best Innovation Award – ₹7,500

📌 Rules
• All projects must be built during the hackathon.
• Open-source libraries and frameworks are allowed.
• Pre-existing project code is not permitted.
• Cross-team collaboration and knowledge sharing are encouraged.
• Teams must submit source code, documentation, and presentation materials before the deadline.

📊 Judging Criteria
• Innovation
• Technical Implementation
• Usability
• Accessibility Impact
• Presentation Quality

✨ More Than a Competition
Starlet 5.0 is an opportunity to collaborate with passionate innovators, receive mentorship, and create technology that can make a real difference in people''s lives.

Join us in building a future where accessibility, inclusion, and independence are available to everyone.', 'NONE', 150001, 200, 'AUTO', 'APPROVED', TRUE, 'INDIVIDUAL', 1, 4, 150, 'MANUAL_UPI', 'Use Scanner to Pay', 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/qr-codes/1781692093188-200438313', '#0a1f1f', '#0d2f2f', '#00ff88', '[{"type":"text","label":"name","required":true},{"type":"text","label":"phone","required":true},{"type":"text","label":"email","required":true},{"type":"text","label":"college","required":true}]', NULL, TRUE, FALSE, '2026-06-17T04:53:48.581Z', '2026-06-17T05:11:33.617Z', NULL)
ON CONFLICT DO NOTHING;

-- FAQ (24 rows)
INSERT INTO "FAQ" ("id", "eventId", "question", "answer", "order", "createdAt", "updatedAt") VALUES
    ('85decdb6-a6f3-4231-bde9-0d4fa0584938', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'Who can participate?', 'All engineering students (UG/PG) from any college in India can participate. No prior hackathon experience needed!', 1, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('b484fe8e-c571-4616-930f-3d36e2e8a9b7', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'What is the team size?', 'Teams of 2 to 4 members are allowed. Solo participation is not permitted.', 2, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('062f3f9a-4773-42d5-85a2-e41b157e9613', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'Is it free to register?', 'Yes! LenientHack 2026 is completely free to register and participate.', 3, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('08ee2847-f8c0-4567-8983-d70449ef1061', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'Will we get a certificate?', 'Yes, all participants who submit their project will receive a certificate. Winners get special achievement certificates.', 4, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('90e7f5d0-ad18-4270-b62b-08ba74396be0', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'What should I build?', 'Anything — web app, mobile app, AI/ML model, blockchain dApp, or hardware hack — as long as it aligns with one of our themes.', 5, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('a567e20b-1f06-4065-b14b-920a3259d4ab', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', 'Do I need a working prototype?', 'No prototype required. However, having a demo increases your chances in the final round.', 1, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('8462f919-6742-4284-ad70-e413786d59d0', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', 'Is travel reimbursement available?', 'Travel reimbursement is provided for teams shortlisted to the final round.', 2, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('65d9802b-0a92-4a0d-b4b2-414f511c9d42', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', 'What should the presentation include?', 'Problem statement, solution, target market, business model, and impact metrics. 10 minutes + 5 minutes Q&A.', 3, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('0aff1622-b1e5-4c6e-a874-57d524c1f829', 'a824decf-1fc3-446e-b5ba-6b0270d15c7f', 'Do I need prior cybersecurity experience?', 'No! The sessions are designed for beginners to intermediate learners. Basic networking knowledge is helpful.', 1, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('f402960b-8cf7-4403-b1d9-d48a7c8b6dc1', 'a824decf-1fc3-446e-b5ba-6b0270d15c7f', 'Is this a live or recorded event?', 'It is a live event. Recordings will NOT be shared after the event.', 2, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('7137167e-2e94-4007-92e8-93710268ecb8', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'Will the recording be available?', 'Yes, a recording will be shared with all registered participants within 48 hours after the webinar.', 1, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('d5b1fa48-1d10-470a-89ae-8566b01d403b', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'How do I get the meeting link?', 'The Zoom link will be emailed to you 24 hours before the event starts.', 2, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('5731b173-179f-4787-ad57-5cf1bee9e549', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', 'Can I participate from outside India?', 'This is an offline event at BITS Pilani campus. International participants are welcome but must arrange their own travel.', 1, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('e3c395e4-2f44-4c67-b9f9-ccd50f1e0711', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', 'Where can I stay?', 'Accommodation in BITS Pilani hostels will be arranged for outstation participants on first-come-first-served basis.', 2, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('811e8c56-aa68-4cce-8ddf-da29cdb8e1f8', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', 'What languages are allowed?', 'C++, Python, and Java only. Submissions will be judged on a competitive programming judge platform.', 3, '2026-05-21T11:32:03.679Z', '2026-05-21T11:32:03.679Z'),
    ('6f4f7384-ed5c-4afa-90e2-a03a02ade468', 'c603a45b-c141-42f5-8312-0a000d516ab9', 'What is the type of event?', 'This is an online event, accessible from anywhere.
', 1, '2026-05-21T11:56:59.206Z', '2026-05-22T11:48:13.468Z'),
    ('ee19e7bf-4790-48e4-a240-a635b8dea782', 'c603a45b-c141-42f5-8312-0a000d516ab9', 'Who is the VIP speaker?', 'The event features Ray Podder, a renowned designer, strategist, and systems architect.
', 2, '2026-05-21T11:56:59.206Z', '2026-05-22T11:48:13.697Z'),
    ('576a65bb-5ef9-4b3e-b970-1494a671da36', 'c603a45b-c141-42f5-8312-0a000d516ab9', 'What is the event timing?', 'The session will be held from 7:30 PM to 9:00 PM.', 3, '2026-05-21T11:56:59.206Z', '2026-05-22T11:48:13.862Z'),
    ('0180fad5-e9b8-4df7-9960-d47a0278dee0', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', 'What is the type of event?', 'This is an online event, accessible from anywhere.', 1, '2026-05-31T12:46:55.849Z', '2026-05-31T13:08:16.788Z'),
    ('6e759f8c-8f6d-41c6-8d82-012b269c6248', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', 'Who is the VIP speaker?', 'The event features Ray Podder, a renowned designer, strategist, and systems architect.
', 2, '2026-05-31T12:46:55.849Z', '2026-05-31T13:08:17.130Z'),
    ('55f912be-75cb-4c3d-8587-79ee5d1bddc1', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', 'What is the event timing?', 'The session will be held from 7:00 PM to 9:00 PM.', 3, '2026-05-31T12:46:55.849Z', '2026-05-31T13:08:17.424Z'),
    ('1f030ac0-6aee-468b-8609-fb528ca01f2d', 'c03d7f97-e356-4139-a85a-5e99187aa48f', 'What is Starlet 5.0?', 'Starlet 5.0 is a high-impact innovation hackathon dedicated to building technology that empowers people with disabilities and improves accessibility across the world.', 1, '2026-06-17T04:53:48.581Z', '2026-06-17T05:05:19.208Z'),
    ('7a0d9d0c-04bc-4776-bead-8c2866d5d1ec', 'c03d7f97-e356-4139-a85a-5e99187aa48f', 'Who can participate?', 'The event is open to all women and non-binary students and innovators. Whether you''re a beginner or a pro, you''re welcome!', 2, '2026-06-17T04:53:48.581Z', '2026-06-17T05:05:19.615Z'),
    ('c37c2ab9-448d-4667-9348-6ed8be8e7668', 'c03d7f97-e356-4139-a85a-5e99187aa48f', 'Do I need a team to register?', 'No! You can register as a solo participant and we will put you in a team, or form a team of 3 to 4 members.', 3, '2026-06-17T04:53:48.581Z', '2026-06-17T05:05:19.945Z')
ON CONFLICT DO NOTHING;

-- Referral (1 rows)
INSERT INTO "Referral" ("id", "code", "eventId", "referrerId", "clicks", "conversions", "createdAt") VALUES
    ('9a0ed902-45ea-4793-b366-a9864b5f0fa8', 'jason_paul_mulerikkal', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', '2a80e73b-043e-4d27-aeae-7bbeeeac65e6', 0, 0, '2026-05-31T13:33:04.929Z')
ON CONFLICT DO NOTHING;

-- Registration (23 rows)
INSERT INTO "Registration" ("id", "eventId", "userId", "referralId", "status", "paymentStatus", "formData", "paymentRef", "paymentProof", "registeredAt", "updatedAt") VALUES
    ('cc5bc5c0-6439-4a2c-96cd-9c76b14c20d7', '19965872-44b5-4f77-b319-9dbb0ddba02a', '35de982a-90a8-442f-8159-9226ed318d25', NULL, 'APPROVED', 'UNPAID', '{"Team Name":"ByteBuilders","GitHub Profile URL":"https://github.com/ananya","Problem Statement Interest":"AI/ML"}', NULL, NULL, '2026-05-21T11:32:04.220Z', '2026-05-21T11:32:04.220Z'),
    ('f0e864c2-a255-40f3-84d8-71bbe01532d9', '19965872-44b5-4f77-b319-9dbb0ddba02a', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', NULL, 'APPROVED', 'UNPAID', '{"Team Name":"ByteBuilders","GitHub Profile URL":"https://github.com/rohan","Problem Statement Interest":"Web3"}', NULL, NULL, '2026-05-21T11:32:04.347Z', '2026-05-21T11:32:04.347Z'),
    ('409b9103-2e9f-4311-8abb-aa36461f373e', '19965872-44b5-4f77-b319-9dbb0ddba02a', 'b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', NULL, 'PENDING', 'UNPAID', '{"Team Name":"CodeCraft","GitHub Profile URL":"https://github.com/sneha"}', NULL, NULL, '2026-05-21T11:32:04.406Z', '2026-05-21T11:32:04.406Z'),
    ('980f229d-b55f-4916-bc55-1e6eaf68e825', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', '35de982a-90a8-442f-8159-9226ed318d25', NULL, 'APPROVED', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.465Z', '2026-05-21T11:32:04.465Z'),
    ('1183f45e-8086-49e2-9c20-9a850f373514', 'aa4084c4-3b46-4ed6-a7f0-4381b82b7cba', 'dd1b806d-cd1c-4775-a63d-ab05132c4654', NULL, 'PENDING', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.573Z', '2026-05-21T11:32:04.573Z'),
    ('a53ce659-b56b-4c8a-8975-cb953a4213ba', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', NULL, 'APPROVED', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.636Z', '2026-05-21T11:32:04.636Z'),
    ('7863495d-9f37-4482-837d-92a0e253fd40', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', NULL, 'APPROVED', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.700Z', '2026-05-21T11:32:04.700Z'),
    ('c3a84a30-2b72-47c2-977f-d33d4098d6b7', '638840ca-98b9-4ade-8ae2-a8efbfc961a2', 'd3fdaf66-ffeb-438a-919e-073c85afee5c', NULL, 'APPROVED', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.761Z', '2026-05-21T11:32:04.761Z'),
    ('cadbba17-5866-4b69-976d-34af4bc30991', 'a824decf-1fc3-446e-b5ba-6b0270d15c7f', 'dd1b806d-cd1c-4775-a63d-ab05132c4654', NULL, 'APPROVED', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.836Z', '2026-05-21T11:32:04.836Z'),
    ('15d170d0-2984-4cc0-ac60-bb2be18591b4', 'a824decf-1fc3-446e-b5ba-6b0270d15c7f', 'd3fdaf66-ffeb-438a-919e-073c85afee5c', NULL, 'APPROVED', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.917Z', '2026-05-21T11:32:04.917Z'),
    ('c85b418b-dacd-40df-b690-a684a5438927', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', '35de982a-90a8-442f-8159-9226ed318d25', NULL, 'PENDING', 'UNPAID', NULL, NULL, NULL, '2026-05-21T11:32:04.985Z', '2026-05-21T11:32:04.985Z'),
    ('6c82d989-45e8-4f4e-9994-9b2df84e83d2', 'c603a45b-c141-42f5-8312-0a000d516ab9', 'cd0ca165-493b-438a-a1e2-affd72026bba', NULL, 'APPROVED', 'UNPAID', '{"name":"Adith Kp","email":"adithkp007@gmail.com","phone":"+91 7306926033","Year of passout":"2026","linkedinPostLink":"https://www.linkedin.com/in/adith-kp-660488239/"}', NULL, NULL, '2026-05-22T13:32:03.891Z', '2026-05-22T13:32:03.891Z'),
    ('ae22ac74-1277-4653-835f-b539234c2c1e', 'c603a45b-c141-42f5-8312-0a000d516ab9', '96c2c5d5-76d6-455e-842d-c3e7202db8a4', NULL, 'APPROVED', 'UNPAID', '{"name":"Rahul R P","email":"rprahulofficial07@gmail.com","phone":"+1234567890","Year of passout":"2027"}', NULL, NULL, '2026-05-25T14:22:03.976Z', '2026-05-25T14:22:03.976Z'),
    ('a91a5203-4f4c-4ae3-bcb5-9cf32c75b150', 'c6a74ffe-3dce-4951-97fb-e0afe791f451', '311965d1-7f4e-4f4c-95d5-472a073e554f', NULL, 'PENDING', 'UNPAID', '{"name":"Augustine Vadakumchery","email":"augustinevadakumcherry@gmail.com","phone":"GNRLKLK","college":"JQR JBR3JKB3R"}', NULL, NULL, '2026-05-26T02:38:21.341Z', '2026-05-26T02:38:21.341Z'),
    ('5ef86b42-67f6-4781-9387-2cfc9ee7c331', 'c603a45b-c141-42f5-8312-0a000d516ab9', '311965d1-7f4e-4f4c-95d5-472a073e554f', NULL, 'APPROVED', 'UNPAID', '{"name":"Augustine Vadakumchery","email":"augustinevadakumcherry@gmail.com","phone":"28oho21rh","Year of passout":"9013209"}', NULL, NULL, '2026-05-26T04:38:41.036Z', '2026-05-26T04:38:41.036Z'),
    ('7b01e59f-d81b-4538-92d9-fb19b7aea660', 'c603a45b-c141-42f5-8312-0a000d516ab9', '156fc25d-c9ff-4fc1-b6d7-f9b1aaee0f2f', NULL, 'APPROVED', 'UNPAID', '{"name":"Angith Kishor","email":"angithananya@gmail.com","phone":"9896898989","Year of passout":"2421"}', NULL, NULL, '2026-05-26T10:56:02.346Z', '2026-05-26T10:56:02.346Z'),
    ('f51a7aa7-7fb5-4751-b874-54cdef43dfa0', 'c603a45b-c141-42f5-8312-0a000d516ab9', '283ee50a-b6fe-4b29-a229-41caee7f7672', NULL, 'APPROVED', 'UNPAID', '{"name":"Super Admin","email":"admin@lenienttree.com","phone":"+1234567890","Year of passout":"2027"}', NULL, NULL, '2026-05-27T14:55:03.425Z', '2026-05-27T14:55:03.425Z'),
    ('9d00a6fa-4f8c-47aa-b22b-b667f3aaeb74', 'c603a45b-c141-42f5-8312-0a000d516ab9', 'b64d2934-dc88-448f-9806-fbaafac8ac32', NULL, 'APPROVED', 'UNPAID', '{"name":"Tinkerhub CUCEK","email":"studyjams4@gmail.com","phone":"+1234567890","Year of passout":"2027"}', NULL, NULL, '2026-05-28T09:00:48.878Z', '2026-05-28T09:00:48.878Z'),
    ('94ebda51-4b1d-4668-a623-1d615aa32781', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', '283ee50a-b6fe-4b29-a229-41caee7f7672', NULL, 'APPROVED', 'UNPAID', '{"name":"Super Admin","email":"admin@lenienttree.com","phone":"+1234567890","college":"LT University"}', NULL, NULL, '2026-05-31T12:50:52.666Z', '2026-05-31T12:50:52.666Z'),
    ('5c1cc764-fa5a-481e-aee7-a851cdb37e19', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', '96c2c5d5-76d6-455e-842d-c3e7202db8a4', NULL, 'APPROVED', 'UNPAID', '{"name":"Rahul R P","email":"rprahulofficial07@gmail.com","phone":"+91 95444 51720","college":"Cochin University College of Engineering and technology "}', NULL, NULL, '2026-05-31T13:06:43.801Z', '2026-05-31T13:06:43.801Z'),
    ('71850598-ceba-442f-a2b6-7bc9a5ce81c1', '68317ed1-0660-41f8-b308-cd9e1fd60a4e', '039807ef-1bad-4f32-939e-a4da514fc773', NULL, 'APPROVED', 'UNPAID', '{"name":"Aleena M Siju","email":"aleenamsiju@gmail.com","phone":"8089577506","college":"Rajagiri School of Engineering and Technology "}', NULL, NULL, '2026-06-01T04:30:59.416Z', '2026-06-01T04:30:59.416Z'),
    ('ad3ed579-3dc9-42a9-8a68-6acca80b6933', 'c03d7f97-e356-4139-a85a-5e99187aa48f', 'ba7bdf52-a34b-42e2-a393-3b9844d7c956', NULL, 'APPROVED', 'UNPAID', '{"name":"Super Admin","email":"augustinevadakumchery@lenienttree.com","phone":"+1234567890","college":"Cochin University College of Engineering Kuttanad","teamMembers":[{"name":"rahul","email":"rprahulofficial07@gmail.com","phone":"9544451720","college":"cusat"},{"name":"9544451720","email":"rprahulofficial07@gmail.com","phone":"9544451720","college":"9544451720"}]}', NULL, NULL, '2026-06-17T05:08:26.352Z', '2026-06-17T05:08:26.352Z'),
    ('3d6693b6-925d-479a-848c-56c90c593bdc', 'c03d7f97-e356-4139-a85a-5e99187aa48f', '96c2c5d5-76d6-455e-842d-c3e7202db8a4', NULL, 'APPROVED', 'UNPAID', '{"name":"Rahul R P","email":"rprahulofficial07@gmail.com","phone":"+1234567891","college":"Cochin University College of Engineering Kuttanad"}', NULL, NULL, '2026-06-17T05:09:21.711Z', '2026-06-17T05:09:21.711Z')
ON CONFLICT DO NOTHING;

-- SocialLink (20 rows)
INSERT INTO "SocialLink" ("id", "userId", "linkedin", "github", "instagram", "twitter", "website") VALUES
    ('84c70a5d-713e-4f1f-99cb-c8cf325738ba', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', 'https://linkedin.com/in/arjunsharma', 'https://github.com/arjunsharma', NULL, NULL, NULL),
    ('6f8a5a56-4835-449d-bf52-9286d442656f', '5a2cb68f-984c-49c9-b28f-04fda56dd64a', 'https://linkedin.com/in/priyanair', NULL, 'https://instagram.com/priya.events', NULL, NULL),
    ('6f86b150-8692-49cc-a7f0-31aa57070215', '35de982a-90a8-442f-8159-9226ed318d25', 'https://linkedin.com/in/ananya', 'https://github.com/ananya', NULL, NULL, NULL),
    ('b51eb34f-2b51-41d8-bde2-0a586a6d3020', '327200dd-1b12-43ca-a9e6-9946e748ecf6', NULL, NULL, NULL, NULL, NULL),
    ('5586bd33-f73d-48ea-8d24-aed233d4f1df', 'cd0ca165-493b-438a-a1e2-affd72026bba', NULL, NULL, NULL, NULL, NULL),
    ('a7f4e583-9e5f-4bd3-99ee-99c6d8000a90', '96c2c5d5-76d6-455e-842d-c3e7202db8a4', NULL, NULL, NULL, NULL, NULL),
    ('282cd5f9-9492-488e-9c9f-32c921d7048a', '311965d1-7f4e-4f4c-95d5-472a073e554f', NULL, NULL, NULL, NULL, NULL),
    ('bae7fccf-6ce8-4fed-a097-dced67a78a45', '92cadf62-b896-4cdd-9d8c-74dc13db74fe', NULL, NULL, NULL, NULL, NULL),
    ('73b39179-3f1d-4a07-8dee-f0a27d3d81d4', 'b46f920f-dfee-4b0c-842c-1f0a2f89a8b4', NULL, NULL, NULL, NULL, NULL),
    ('9d284680-1733-4074-ab91-38bdf24ac4ce', '156fc25d-c9ff-4fc1-b6d7-f9b1aaee0f2f', NULL, NULL, NULL, NULL, NULL),
    ('8a148fd5-09f4-4d6e-8115-d0371f74f2ed', '22519cb3-4000-4a8d-89c3-c1ee619198a1', NULL, NULL, NULL, NULL, NULL),
    ('923ade30-9247-4463-9911-acc974a8e4f5', '748aaa5d-1ebb-4c98-ac48-5f8ce85869e0', NULL, NULL, NULL, NULL, NULL),
    ('73779c2b-c006-4788-a5f7-7a303dbdc2b8', '4eb914ff-d57c-41c8-b1b8-69751a6f3650', NULL, NULL, NULL, NULL, NULL),
    ('884b8c33-ee51-4420-8e9a-0d3ceced16c1', 'b64d2934-dc88-448f-9806-fbaafac8ac32', NULL, NULL, NULL, NULL, NULL),
    ('474560ff-4c43-400c-8b05-6dda0b69ca0d', '1fe2c024-a83c-4cd7-86ec-098af14171cf', NULL, NULL, NULL, NULL, NULL),
    ('236d7dee-8b5a-46d7-84f6-1c98688077b6', 'f12f5a46-028d-44c0-9f0d-c37a69ed6915', NULL, NULL, NULL, NULL, NULL),
    ('0049ed87-6b8b-4a9f-9d57-21f0beecafb9', '2a80e73b-043e-4d27-aeae-7bbeeeac65e6', NULL, NULL, NULL, NULL, NULL),
    ('939daffe-e1d0-4853-a9f9-8ca75f7e99c9', '039807ef-1bad-4f32-939e-a4da514fc773', NULL, NULL, NULL, NULL, NULL),
    ('f5ca1334-df9a-41a9-8c18-7f86332e0236', 'bce2b765-6261-4fdb-9fbc-8044b41c8dee', NULL, NULL, NULL, NULL, NULL),
    ('9fa1b29e-3c12-41a1-998e-0120d1f7203e', 'ea32cb3f-8beb-4b90-9e88-c555ac306024', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- User (27 rows)
INSERT INTO "User" ("id", "name", "email", "phone", "passwordHash", "role", "isOrganizer", "college", "graduationYear", "bio", "profileImage", "status", "isEmailVerified", "googleId", "createdAt", "updatedAt", "deletedAt", "internshipDomains", "internshipInterest", "dateOfBirth") VALUES
    ('283ee50a-b6fe-4b29-a229-41caee7f7672', 'Super Admin', 'admin@lenienttree.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'ADMIN', TRUE, 'LT University', 2020, 'Platform administrator for LenientTree.', NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:00.099Z', '2026-05-21T11:32:00.099Z', NULL, NULL, NULL, NULL),
    ('2ac2a2ef-1f45-4cfd-8170-3607f3371d13', 'Arjun Sharma', 'arjun@organizer.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', TRUE, 'IIT Madras', 2022, 'Tech event organizer and hackathon enthusiast.', NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:00.245Z', '2026-05-21T11:32:00.245Z', NULL, NULL, NULL, NULL),
    ('5a2cb68f-984c-49c9-b28f-04fda56dd64a', 'Priya Nair', 'priya@organizer.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', TRUE, 'NIT Trichy', 2021, 'Passionate about building communities through events.', NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:00.864Z', '2026-05-21T11:32:00.864Z', NULL, NULL, NULL, NULL),
    ('ea514d62-840f-4136-a7e0-4e47a81b0000', 'Ravi Kumar', 'ravi@organizer.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', TRUE, 'VIT Vellore', 2023, 'Webinar and conclave organizer.', NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:01.397Z', '2026-05-21T11:32:01.397Z', NULL, NULL, NULL, NULL),
    ('35de982a-90a8-442f-8159-9226ed318d25', 'Ananya Krishnan', 'ananya@student.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', FALSE, 'SRM Institute', 2026, 'Full-stack dev, loves hackathons.', NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:01.465Z', '2026-05-21T11:32:01.465Z', NULL, NULL, NULL, NULL),
    ('14bb36e7-e7af-4195-84a0-92bfe8cde1bf', 'Rohan Mehta', 'rohan@student.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', FALSE, 'BITS Pilani', 2025, 'Designer & developer hybrid.', NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:01.918Z', '2026-05-21T11:32:01.918Z', NULL, NULL, NULL, NULL),
    ('b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', 'Sneha Joshi', 'sneha@student.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', FALSE, 'Manipal University', 2027, 'Competitive programmer and open-source contributor.', NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:02.280Z', '2026-05-21T11:32:02.280Z', NULL, NULL, NULL, NULL),
    ('dd1b806d-cd1c-4775-a63d-ab05132c4654', 'Vikram Singh', 'vikram@student.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', FALSE, 'Delhi University', 2026, NULL, NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:02.641Z', '2026-05-21T11:32:02.641Z', NULL, NULL, NULL, NULL),
    ('d3fdaf66-ffeb-438a-919e-073c85afee5c', 'Meera Patel', 'meera@student.com', NULL, '$2b$10$9DqIHxEz7g/tAyQkcCv.puKRcONM8EuZXOcNhsDy6l6ExEk9zlkGq', 'USER', FALSE, 'Pune University', 2025, NULL, NULL, 'ACTIVE', TRUE, NULL, '2026-05-21T11:32:02.783Z', '2026-05-21T11:32:02.783Z', NULL, NULL, NULL, NULL),
    ('22519cb3-4000-4a8d-89c3-c1ee619198a1', 'Christeena Jestin', 'christeenajestin7@gmail.com', '7025667721', NULL, 'USER', FALSE, 'School of Engineering,Cusat', 2028, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocJAsJ1qzIJkpvEIhZz6_b1bvTPqNRnD0oDIEUSUmLU8Vigevg=s96-c', 'ACTIVE', TRUE, '116701120169077304749', '2026-05-26T11:14:31.386Z', '2026-05-26T11:15:46.779Z', NULL, NULL, NULL, NULL),
    ('748aaa5d-1ebb-4c98-ac48-5f8ce85869e0', 'Mohammed Fezin', 'fezinfezsar@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIHbjVeleEPZQVaTOyTIkxlH1S8rpYYJuUzb2gjM2WqSIm1RXs=s96-c', 'ACTIVE', TRUE, '116057462308137781755', '2026-05-26T12:49:55.841Z', '2026-05-26T12:49:55.841Z', NULL, NULL, NULL, NULL),
    ('cd0ca165-493b-438a-a1e2-affd72026bba', 'Adith Kp', 'adithkp007@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocKseXgprgxoy7XoCbUdmay_QJhZp7z575YBUCsUb8S4oZBiFQ=s96-c', 'ACTIVE', TRUE, '107827606523714721173', '2026-05-21T12:45:23.101Z', '2026-05-21T12:45:23.101Z', NULL, NULL, NULL, NULL),
    ('96c2c5d5-76d6-455e-842d-c3e7202db8a4', 'Rahul R P', 'rprahulofficial07@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocLvdrIjhewZCBdMkMrimNvmpRxCEo5rJ2gqTZv36RdPHlTSg2fn9Q=s96-c', 'ACTIVE', TRUE, '110604004251689103566', '2026-05-25T13:46:35.197Z', '2026-05-25T13:46:35.197Z', NULL, NULL, NULL, NULL),
    ('311965d1-7f4e-4f4c-95d5-472a073e554f', 'Augustine Vadakumchery', 'augustinevadakumcherry@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocK838cNqqP44b47o1aPr1RCFlsuOT8eD2xTCXUR956s8K7Immev=s96-c', 'ACTIVE', TRUE, '108779239437280433554', '2026-05-26T02:27:59.202Z', '2026-05-26T02:27:59.202Z', NULL, NULL, NULL, NULL),
    ('92cadf62-b896-4cdd-9d8c-74dc13db74fe', 'Meera', 'jeebloom232@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocKHlh9TULaHQ98SqYLMDjY9LFFuC6vPgLuEbNKAGGaaR45sTA=s96-c', 'ACTIVE', TRUE, '100435869650605663237', '2026-05-26T02:37:26.535Z', '2026-05-26T02:37:26.535Z', NULL, NULL, NULL, NULL),
    ('b46f920f-dfee-4b0c-842c-1f0a2f89a8b4', 'Malavika Gopi', 'malavikagopi777@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocI1IOgmDJwx2YSA8aRFmdPGS6QScEVs2-iZtmmBvw_1J8p90n1K=s96-c', 'ACTIVE', TRUE, '118124354661646906308', '2026-05-26T08:26:25.736Z', '2026-05-26T08:26:25.736Z', NULL, NULL, NULL, NULL),
    ('4eb914ff-d57c-41c8-b1b8-69751a6f3650', 'Parthiv', 'rprahulcoder@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocILsnXjuQzbL9vJRfSrGsBz_Gl81ai3Arlse-NcqhvS-LDKgQ=s96-c', 'ACTIVE', TRUE, '114508856690426739349', '2026-05-27T14:57:56.276Z', '2026-05-27T14:57:56.276Z', NULL, NULL, NULL, NULL),
    ('b64d2934-dc88-448f-9806-fbaafac8ac32', 'Tinkerhub CUCEK', 'studyjams4@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIqRnWWU-G1lJxx092npSkTqXEzxf5C7_5Xq8HoEX4_2-pKavc=s96-c', 'ACTIVE', TRUE, '103055518719301839301', '2026-05-27T15:10:29.961Z', '2026-05-27T15:10:29.961Z', NULL, NULL, NULL, NULL),
    ('1fe2c024-a83c-4cd7-86ec-098af14171cf', 'Nobin Sijo', 'nobinsijo360t@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIXwmi9VgThuLIh-nR3st5wGoSy1X-UwMUrYyRpdb_hG40V54Xq=s96-c', 'ACTIVE', TRUE, '101384384735398666368', '2026-05-28T04:02:25.774Z', '2026-05-28T04:02:25.774Z', NULL, NULL, NULL, NULL),
    ('f12f5a46-028d-44c0-9f0d-c37a69ed6915', 'AUGUSTINE VADAKUMCHERY', 'augustine.lenienttree@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocI9B0PAVfh69L1IxltobiQnHKSf1VdmtWhMh1SroRSTVopeAA=s96-c', 'ACTIVE', TRUE, '106766555293949876464', '2026-05-31T03:10:46.423Z', '2026-05-31T03:10:46.423Z', NULL, NULL, NULL, NULL),
    ('2a80e73b-043e-4d27-aeae-7bbeeeac65e6', 'Jason paul mulerikkal', 'abc@gmail.com', '+1234567890', '$2b$12$wNhtOc3IwMIA3plPHHuHyehvVOaARAHbzNUDpmBkJYiyRUxieTgcS', 'USER', FALSE, 'LT University', 2028, NULL, NULL, 'ACTIVE', FALSE, NULL, '2026-05-31T13:31:15.914Z', '2026-05-31T13:31:15.914Z', NULL, NULL, NULL, NULL),
    ('156fc25d-c9ff-4fc1-b6d7-f9b1aaee0f2f', 'Angith Kishor', 'angithananya@gmail.com', '9896898989', NULL, 'USER', FALSE, 'bfhjbkm''ll/.', 2022, 'fagedgdgfg', 'https://lh3.googleusercontent.com/a/ACg8ocILawjC2EYnC7lwdU35AIWlNsodJVv_4YAqHKN9Bydh0c0xfg=s96-c', 'ACTIVE', TRUE, '106896597350226465909', '2026-05-26T10:35:00.686Z', '2026-05-26T10:49:10.915Z', NULL, NULL, NULL, NULL),
    ('039807ef-1bad-4f32-939e-a4da514fc773', 'Aleena M Siju', 'aleenamsiju@gmail.com', NULL, NULL, 'USER', FALSE, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocJnFNNcS839YaO33-7gl_H3ldlB9zFHK2OyD8umorqiNB9ukw=s96-c', 'ACTIVE', TRUE, '106255803030035479861', '2026-06-01T04:30:02.870Z', '2026-06-01T04:30:02.870Z', NULL, NULL, NULL, NULL),
    ('327200dd-1b12-43ca-a9e6-9946e748ecf6', 'Adith KP', 'adithkp000@gmail.com', '+917306916033', '$2b$12$oGXiLhWVkyS.lfMLs1RsZetwBPHrS04yuDITiARSQ.g2LDKfGAMD6', 'USER', TRUE, 'College Of engineering Karunagappally', 2026, NULL, 'https://stream-curator-audio.s3.ap-south-1.amazonaws.com/lenienttree/avatars/user_327200dd-1b12-43ca-a9e6-9946e748ecf6', 'ACTIVE', TRUE, '110623468265456409006', '2026-05-21T11:46:38.477Z', '2026-06-13T12:20:05.378Z', NULL, '["Full Stack Development"]', TRUE, NULL),
    ('ea32cb3f-8beb-4b90-9e88-c555ac306024', 'Adith KP', 'adithkp008@gmail.com', '7306916033', '$2b$12$OGSPaEZBYSzERo/KFT0KH.zVY.BEK2YiwClE1jBRr6LlgGyN9YsTO', 'USER', FALSE, 'CEK', 2026, NULL, NULL, 'ACTIVE', FALSE, NULL, '2026-06-15T10:35:37.372Z', '2026-06-15T10:35:47.702Z', NULL, '["Artificial Intelligence (AI)"]', TRUE, '2004-08-11T18:30:00.000Z'),
    ('ba7bdf52-a34b-42e2-a393-3b9844d7c956', 'Super Admin', 'augustinevadakumchery@lenienttree.com', NULL, '$2b$12$xGwH3LG59WfeLCftxZpG/OlbwdcSbHKd0mfSpxf586GtLHuyqhzyK', 'ADMIN', TRUE, NULL, NULL, 'Platform administrator for LenientTree.', NULL, 'ACTIVE', TRUE, NULL, '2026-06-15T14:05:02.285Z', '2026-06-15T14:05:02.285Z', NULL, NULL, NULL, NULL),
    ('bce2b765-6261-4fdb-9fbc-8044b41c8dee', 'Abiram T Bijoy', 'abirambijoy@gmail.com', '+919061892761', '$2b$12$WDKytpry4X2rmKGHqXkcUuWjhV2stiFlbtqfc4O1BjoIm2C0Xl/K6', 'USER', TRUE, 'School Of Engineering,Cusat', 2026, NULL, NULL, 'ACTIVE', FALSE, NULL, '2026-06-13T02:19:15.370Z', '2026-06-15T14:07:57.875Z', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- UserSkill (15 rows)
INSERT INTO "UserSkill" ("id", "userId", "skill") VALUES
    ('75266ea8-62c2-451e-bf8d-3140797ebfdd', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', 'React'),
    ('dde415d3-b521-4a73-b881-50ecbf95e047', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', 'Node.js'),
    ('c51ae91e-d4d9-4f3b-a5bb-93568e212e7a', '2ac2a2ef-1f45-4cfd-8170-3607f3371d13', 'Event Management'),
    ('c7fd67a7-a99a-40c2-94b9-fd9cc8a8d7aa', '5a2cb68f-984c-49c9-b28f-04fda56dd64a', 'Marketing'),
    ('d4dd3910-28eb-46f7-84ed-598528f9c6c0', '5a2cb68f-984c-49c9-b28f-04fda56dd64a', 'Community Building'),
    ('2389be4f-0e58-43ea-a7f4-06cc97d317f5', '5a2cb68f-984c-49c9-b28f-04fda56dd64a', 'Design'),
    ('5cc7e36f-244d-41c4-9759-0e3f9772d736', '35de982a-90a8-442f-8159-9226ed318d25', 'Python'),
    ('6026e967-738e-4b44-a59b-f5d68f021b4b', '35de982a-90a8-442f-8159-9226ed318d25', 'Machine Learning'),
    ('9fac21a4-67a9-4512-a060-6a9fec5cc96d', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', 'Figma'),
    ('a40885f9-ab29-411a-a294-218573974a37', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', 'JavaScript'),
    ('e1eb396a-df35-4532-8c68-997ff633ea8c', '14bb36e7-e7af-4195-84a0-92bfe8cde1bf', 'UI/UX'),
    ('85054bcb-8201-4122-a6ce-5b24db1b5119', 'b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', 'C++'),
    ('9a87aec0-3b78-4302-b0b0-93d3a4e82a2a', 'b0e5ac77-a35a-4e23-bf87-ea9e4aea8746', 'Algorithms'),
    ('b8b729bd-15d2-4a66-9246-98eed128b5b9', 'd3fdaf66-ffeb-438a-919e-073c85afee5c', 'Data Science'),
    ('131b3df4-0621-471d-952f-f58604a1c0d3', 'd3fdaf66-ffeb-438a-919e-073c85afee5c', 'SQL')
ON CONFLICT DO NOTHING;


SET session_replication_role = DEFAULT;

-- ✅ Backup complete