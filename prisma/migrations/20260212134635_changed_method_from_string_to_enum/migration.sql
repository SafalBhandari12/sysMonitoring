/*
  Warnings:

  - Changed the type of `method` on the `Api` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "methodEnum" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- AlterTable
ALTER TABLE "Api" DROP COLUMN "method",
ADD COLUMN     "method" "methodEnum" NOT NULL;
