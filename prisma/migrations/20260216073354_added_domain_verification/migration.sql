/*
  Warnings:

  - The required column `verificationCode` was added to the `Api` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "DomainVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- AlterTable
ALTER TABLE "Api" ADD COLUMN     "lastVerificationAttempt" TIMESTAMP(3),
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationCode" TEXT NOT NULL,
ADD COLUMN     "verificationStatus" "DomainVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
