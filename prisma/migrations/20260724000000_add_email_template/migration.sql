-- CreateTable
CREATE TABLE "EmailTemplate" (
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "bodyHtml" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("name")
);
