/*
  Warnings:

  - A unique constraint covering the columns `[apiId,date]` on the table `DailyStats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DailyStats_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_apiId_date_key" ON "DailyStats"("apiId", "date");
