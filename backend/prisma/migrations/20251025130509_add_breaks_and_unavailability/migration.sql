-- CreateEnum
CREATE TYPE "AvailabilitySlotType" AS ENUM ('AVAILABLE', 'BREAK');

-- CreateEnum
CREATE TYPE "UnavailabilityReason" AS ENUM ('SICK_LEAVE', 'VACATION', 'PERSONAL_LEAVE', 'EMERGENCY', 'TRAINING', 'OTHER');

-- AlterTable
ALTER TABLE "TherapistAvailability" ADD COLUMN     "slotType" "AvailabilitySlotType" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "TherapistUnavailability" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" "UnavailabilityReason" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapistUnavailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TherapistUnavailability_tenantId_therapistId_idx" ON "TherapistUnavailability"("tenantId", "therapistId");

-- CreateIndex
CREATE INDEX "TherapistUnavailability_tenantId_startDate_endDate_idx" ON "TherapistUnavailability"("tenantId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "TherapistUnavailability" ADD CONSTRAINT "TherapistUnavailability_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapistUnavailability" ADD CONSTRAINT "TherapistUnavailability_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
