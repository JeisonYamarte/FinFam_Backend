/*
  Warnings:

  - You are about to drop the `Closure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Expense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExpenseSplit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Household` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Membership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Closure" DROP CONSTRAINT "Closure_householdId_fkey";

-- DropForeignKey
ALTER TABLE "ClosureBalance" DROP CONSTRAINT "ClosureBalance_closureId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_closureId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_householdId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_paidById_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseSplit" DROP CONSTRAINT "ExpenseSplit_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseSplit" DROP CONSTRAINT "ExpenseSplit_userId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_householdId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- DropTable
DROP TABLE "Closure";

-- DropTable
DROP TABLE "Expense";

-- DropTable
DROP TABLE "ExpenseSplit";

-- DropTable
DROP TABLE "Household";

-- DropTable
DROP TABLE "Membership";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GUEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expenses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "householdId" TEXT NOT NULL,
    "paidById" TEXT NOT NULL,
    "closureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSplits" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ExpenseSplits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Closures" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Closures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Memberships_userId_householdId_key" ON "Memberships"("userId", "householdId");

-- CreateIndex
CREATE INDEX "Expenses_householdId_idx" ON "Expenses"("householdId");

-- CreateIndex
CREATE INDEX "Expenses_closureId_idx" ON "Expenses"("closureId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSplits_expenseId_userId_key" ON "ExpenseSplits"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "Closures_householdId_idx" ON "Closures"("householdId");

-- AddForeignKey
ALTER TABLE "Memberships" ADD CONSTRAINT "Memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memberships" ADD CONSTRAINT "Memberships_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_closureId_fkey" FOREIGN KEY ("closureId") REFERENCES "Closures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplits" ADD CONSTRAINT "ExpenseSplits_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplits" ADD CONSTRAINT "ExpenseSplits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Closures" ADD CONSTRAINT "Closures_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosureBalance" ADD CONSTRAINT "ClosureBalance_closureId_fkey" FOREIGN KEY ("closureId") REFERENCES "Closures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
