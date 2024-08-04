/*
  Warnings:

  - You are about to drop the column `categoriesList` on the `product_groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_groups" DROP COLUMN "categoriesList";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "productGroupId" TEXT;

-- CreateTable
CREATE TABLE "product_group_categories" (
    "id" TEXT NOT NULL,
    "productGroupId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_group_categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_group_categories" ADD CONSTRAINT "product_group_categories_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "product_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_group_categories" ADD CONSTRAINT "product_group_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
