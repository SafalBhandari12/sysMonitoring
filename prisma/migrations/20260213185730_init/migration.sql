-- CreateEnum
CREATE TYPE "methodEnum" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- CreateEnum
CREATE TYPE "apiStatusEnum" AS ENUM ('UP', 'DOWN', 'TIMEOUT', 'ERROR');

-- CreateTable
CREATE TABLE "Api" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" "methodEnum" NOT NULL,
    "headers" JSONB,
    "body" JSONB,
    "processingStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Api_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiResponse" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "status" "apiStatusEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "upCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "maxResponseTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Api_url_key" ON "Api"("url");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "DailyStats"("date");

-- AddForeignKey
ALTER TABLE "ApiResponse" ADD CONSTRAINT "ApiResponse_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStats" ADD CONSTRAINT "DailyStats_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
