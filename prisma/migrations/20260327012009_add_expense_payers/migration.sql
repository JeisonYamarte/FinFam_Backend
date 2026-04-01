/*
  Warnings:

  - You are about to drop the column `paidById` on the `Expenses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Expenses" DROP CONSTRAINT "Expenses_paidById_fkey";

-- AlterTable
ALTER TABLE "Expenses" DROP COLUMN "paidById";

-- CreateTable
CREATE TABLE "ExpensePayers" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ExpensePayers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpensePayers_expenseId_idx" ON "ExpensePayers"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpensePayers_expenseId_userId_key" ON "ExpensePayers"("expenseId", "userId");

-- AddForeignKey
ALTER TABLE "ExpensePayers" ADD CONSTRAINT "ExpensePayers_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePayers" ADD CONSTRAINT "ExpensePayers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
