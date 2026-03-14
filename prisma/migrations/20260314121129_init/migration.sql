-- CreateEnum
CREATE TYPE "DomainVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "methodEnum" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- CreateEnum
CREATE TYPE "apiStatusEnum" AS ENUM ('UP', 'DOWN', 'TIMEOUT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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
    "userId" TEXT NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Api" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" "methodEnum" NOT NULL,
    "headers" JSONB,
    "body" JSONB,
    "upTime" INTEGER NOT NULL DEFAULT 0,
    "p90" INTEGER NOT NULL DEFAULT 0,
    "p99" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
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
    "upTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_domain_key" ON "Domain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Api_domainId_path_key" ON "Api"("domainId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_apiId_date_key" ON "DailyStats"("apiId", "date");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Api" ADD CONSTRAINT "Api_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiResponse" ADD CONSTRAINT "ApiResponse_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStats" ADD CONSTRAINT "DailyStats_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
