/*
  Warnings:

  - You are about to drop the column `specialization` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "specialization",
ADD COLUMN     "specializationId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "TherapyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
