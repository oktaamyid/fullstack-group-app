-- CreateEnum
CREATE TYPE "SplitBillDivisionMethod" AS ENUM ('EQUAL', 'CUSTOM');

-- AlterTable
ALTER TABLE "SplitBill" ADD COLUMN "divisionMethod" "SplitBillDivisionMethod" NOT NULL DEFAULT 'CUSTOM';
