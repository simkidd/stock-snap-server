/*
  Warnings:

  - You are about to drop the column `contactInfo` on the `suppliers` table. All the data in the column will be lost.
  - Added the required column `slug` to the `suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "contactInfo",
ADD COLUMN     "contactAddress" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;
