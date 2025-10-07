/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Wedding` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Wedding_expiresAt_idx";

-- AlterTable
ALTER TABLE "Wedding" DROP COLUMN "expiresAt";
