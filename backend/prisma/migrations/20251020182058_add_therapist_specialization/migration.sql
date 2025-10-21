-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionCost" DECIMAL(10,2),
ADD COLUMN     "sessionDuration" INTEGER,
ADD COLUMN     "specialization" TEXT;
