/*
  Warnings:

  - A unique constraint covering the columns `[invoiceNo]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "sales_invoiceNo_key" ON "sales"("invoiceNo");
