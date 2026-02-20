/*
  Warnings:

  - You are about to drop the column `lastVerificationAttempt` on the `Api` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Api` table. All the data in the column will be lost.
  - You are about to drop the column `verificationAttempts` on the `Api` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `Api` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `Api` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `Api` table. All the data in the column will be lost.
  - You are about to drop the column `maxResponseTime` on the `DailyStats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[domainId,path]` on the table `Api` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `domainId` to the `Api` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Api` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Api_url_key";

-- AlterTable
ALTER TABLE "Api" DROP COLUMN "lastVerificationAttempt",
DROP COLUMN "url",
DROP COLUMN "verificationAttempts",
DROP COLUMN "verificationCode",
DROP COLUMN "verificationStatus",
DROP COLUMN "verifiedAt",
ADD COLUMN     "domainId" TEXT NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DailyStats" DROP COLUMN "maxResponseTime";

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verificationStatus" "DomainVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationCode" TEXT NOT NULL,
    "lastVerificationAttempt" TIMESTAMP(3),
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "nextVerificationAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Domain_domain_key" ON "Domain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Api_domainId_path_key" ON "Api"("domainId", "path");

-- AddForeignKey
ALTER TABLE "Api" ADD CONSTRAINT "Api_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
