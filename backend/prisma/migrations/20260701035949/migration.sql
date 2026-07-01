-- AlterTable
ALTER TABLE "SplitBillMember" ADD COLUMN     "isUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentTxId" INTEGER;

-- AddForeignKey
ALTER TABLE "SplitBillMember" ADD CONSTRAINT "SplitBillMember_paymentTxId_fkey" FOREIGN KEY ("paymentTxId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
