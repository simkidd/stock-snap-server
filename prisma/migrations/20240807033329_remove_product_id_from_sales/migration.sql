/*
  Warnings:

  - You are about to drop the column `productId` on the `sales` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_productId_fkey";

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "productId";
