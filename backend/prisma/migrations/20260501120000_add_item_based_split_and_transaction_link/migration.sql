-- CreateEnum
ALTER TYPE "TransactionType" ADD VALUE 'SHARED_EXPENSE';

-- CreateTable
CREATE TABLE "SplitBillItem" (
    "id" SERIAL NOT NULL,
    "splitBillId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitBillItemAssignment" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,

    CONSTRAINT "SplitBillItemAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SplitBillItem_splitBillId_idx" ON "SplitBillItem"("splitBillId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitBillItemAssignment_itemId_memberId_key" ON "SplitBillItemAssignment"("itemId", "memberId");

-- CreateIndex
CREATE INDEX "SplitBillItemAssignment_memberId_idx" ON "SplitBillItemAssignment"("memberId");

-- AlterTable
ALTER TABLE "SplitBill" ADD COLUMN "transactionId" INTEGER;

-- CreateIndex
CREATE INDEX "SplitBill_transactionId_idx" ON "SplitBill"("transactionId");

-- AddForeignKey
ALTER TABLE "SplitBillItem" ADD CONSTRAINT "SplitBillItem_splitBillId_fkey" FOREIGN KEY ("splitBillId") REFERENCES "SplitBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitBillItemAssignment" ADD CONSTRAINT "SplitBillItemAssignment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SplitBillItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitBillItemAssignment" ADD CONSTRAINT "SplitBillItemAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SplitBillMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitBill" ADD CONSTRAINT "SplitBill_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
