/*
  Warnings:

  - Added the required column `isCorrectStatusCode` to the `ApiResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiResponse" ADD COLUMN     "isCorrectStatusCode" BOOLEAN NOT NULL;
