-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "account" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_amount_idx" ON "Transaction"("userId", "amount");
