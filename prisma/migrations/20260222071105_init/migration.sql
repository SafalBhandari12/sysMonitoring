/*
  Warnings:

  - The values [ERROR] on the enum `apiStatusEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `avgResponseTime` on the `DailyStats` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "apiStatusEnum_new" AS ENUM ('UP', 'DOWN', 'TIMEOUT');
ALTER TABLE "ApiResponse" ALTER COLUMN "status" TYPE "apiStatusEnum_new" USING ("status"::text::"apiStatusEnum_new");
ALTER TYPE "apiStatusEnum" RENAME TO "apiStatusEnum_old";
ALTER TYPE "apiStatusEnum_new" RENAME TO "apiStatusEnum";
DROP TYPE "public"."apiStatusEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "DailyStats" DROP COLUMN "avgResponseTime";
