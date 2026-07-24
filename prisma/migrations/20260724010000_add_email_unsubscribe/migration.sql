-- CreateTable
CREATE TABLE "EmailUnsubscribe" (
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailUnsubscribe_pkey" PRIMARY KEY ("email")
);
