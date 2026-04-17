-- CreateEnum
CREATE TYPE "SplitBillStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "SplitBillMemberStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateTable
CREATE TABLE "SplitBill" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "status" "SplitBillStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitBillMember" (
    "id" SERIAL NOT NULL,
    "splitBillId" INTEGER NOT NULL,
    "friendName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "SplitBillMemberStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitBillMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SplitBill_userId_createdAt_idx" ON "SplitBill"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SplitBillMember_splitBillId_status_idx" ON "SplitBillMember"("splitBillId", "status");

-- AddForeignKey
ALTER TABLE "SplitBill" ADD CONSTRAINT "SplitBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitBillMember" ADD CONSTRAINT "SplitBillMember_splitBillId_fkey" FOREIGN KEY ("splitBillId") REFERENCES "SplitBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
