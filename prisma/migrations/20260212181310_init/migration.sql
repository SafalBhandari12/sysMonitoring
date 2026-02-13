/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Api` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Api_url_key" ON "Api"("url");
