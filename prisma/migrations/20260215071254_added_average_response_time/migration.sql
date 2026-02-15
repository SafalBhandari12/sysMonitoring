-- AlterTable
ALTER TABLE "Api" ADD COLUMN     "averageResponseTime" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DailyStats" ADD COLUMN     "upTime" INTEGER NOT NULL DEFAULT 0;
