/*
  Warnings:

  - The values [REORDER] on the enum `ProductStatusEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductStatusEnum_new" AS ENUM ('AVAILABLE', 'OUT', 'LOW');
ALTER TABLE "products" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "status" TYPE "ProductStatusEnum_new" USING ("status"::text::"ProductStatusEnum_new");
ALTER TYPE "ProductStatusEnum" RENAME TO "ProductStatusEnum_old";
ALTER TYPE "ProductStatusEnum_new" RENAME TO "ProductStatusEnum";
DROP TYPE "ProductStatusEnum_old";
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;
