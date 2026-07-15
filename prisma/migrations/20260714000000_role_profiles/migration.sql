-- Role-based signup profiles.
-- Additive & non-destructive: a new nullable enum column on "User" + 5 new tables.
-- Safe to run on production (no data rewrite, no locks on existing rows).

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UserType" AS ENUM ('SCHOOL_STUDENT', 'COLLEGE_STUDENT', 'PROFESSIONAL', 'HR_RECRUITER', 'FOUNDER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userType" "UserType";

-- CreateTable
CREATE TABLE IF NOT EXISTS "SchoolProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "interests" TEXT[],
    "otherInterests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CollegeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interests" TEXT[],
    "otherInterests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CollegeProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProfessionalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "yearsOfExperience" TEXT NOT NULL,
    "keySkills" TEXT[],
    "noticePeriod" TEXT NOT NULL,
    "currentCompany" TEXT,
    "resumeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HrProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companySize" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "hiringRequirement" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "linkedinProfile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HrProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FounderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "founderRole" TEXT NOT NULL,
    "startupStage" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "otherIndustry" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "twitter" TEXT,
    "portfolio" TEXT,
    "startupWebsite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FounderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (one profile row per user)
CREATE UNIQUE INDEX IF NOT EXISTS "SchoolProfile_userId_key" ON "SchoolProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CollegeProfile_userId_key" ON "CollegeProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalProfile_userId_key" ON "ProfessionalProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "HrProfile_userId_key" ON "HrProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "FounderProfile_userId_key" ON "FounderProfile"("userId");

-- AddForeignKey
ALTER TABLE "SchoolProfile" ADD CONSTRAINT "SchoolProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollegeProfile" ADD CONSTRAINT "CollegeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfessionalProfile" ADD CONSTRAINT "ProfessionalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrProfile" ADD CONSTRAINT "HrProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FounderProfile" ADD CONSTRAINT "FounderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
