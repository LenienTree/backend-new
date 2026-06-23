-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "referrerId" DROP NOT NULL,
ADD COLUMN     "college" TEXT;
