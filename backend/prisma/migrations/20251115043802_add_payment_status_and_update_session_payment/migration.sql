/*
  Warnings:

  - You are about to drop the column `amountDue` on the `SessionPayment` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaid` on the `SessionPayment` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `SessionPayment` table. All the data in the column will be lost.
  - You are about to drop the column `isPaidInFull` on the `SessionPayment` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `SessionPayment` table. All the data in the column will be lost.
  - Added the required column `amount` to the `SessionPayment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- DropIndex
DROP INDEX "SessionPayment_tenantId_dueDate_idx";

-- DropIndex
DROP INDEX "SessionPayment_tenantId_isPaidInFull_idx";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "SessionPayment" DROP COLUMN "amountDue",
DROP COLUMN "amountPaid",
DROP COLUMN "dueDate",
DROP COLUMN "isPaidInFull",
DROP COLUMN "paidAt",
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Session_tenantId_paymentStatus_idx" ON "Session"("tenantId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Session_tenantId_patientId_paymentStatus_idx" ON "Session"("tenantId", "patientId", "paymentStatus");

-- CreateIndex
CREATE INDEX "SessionPayment_tenantId_paymentDate_idx" ON "SessionPayment"("tenantId", "paymentDate");
