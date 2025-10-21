/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,phoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE INDEX "User_tenantId_phoneNumber_idx" ON "User"("tenantId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_phoneNumber_key" ON "User"("tenantId", "phoneNumber");
