/*
  Warnings:

  - Added the required column `updatedAt` to the `ClosureBalance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Closures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ExpensePayers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ExpenseSplits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Memberships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClosureBalance" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "ClosureBalance" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Closures" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "Closures" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExpensePayers" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "ExpensePayers" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExpenseSplits" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "ExpenseSplits" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN "receiptPublicId" TEXT,
ADD COLUMN "receiptUrl" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "Expenses" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable: add createdBy as nullable first, then constrain
ALTER TABLE "Expenses" ADD COLUMN "createdBy" TEXT;
UPDATE "Expenses" SET "createdBy" = (SELECT id FROM "Users" ORDER BY "createdAt" LIMIT 1) WHERE "createdBy" IS NULL;
ALTER TABLE "Expenses" ALTER COLUMN "createdBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "Memberships" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "Memberships" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
