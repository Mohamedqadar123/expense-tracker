-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "recurringTransactionId" INTEGER;

-- CreateTable
CREATE TABLE "RecurringTransaction" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "account" TEXT,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextExecutionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTransactionLog" (
    "id" SERIAL NOT NULL,
    "recurringTransactionId" INTEGER NOT NULL,
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "transactionId" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringTransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_idx" ON "RecurringTransaction"("userId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_status_nextExecutionDate_idx" ON "RecurringTransaction"("status", "nextExecutionDate");

-- CreateIndex
CREATE INDEX "RecurringTransactionLog_recurringTransactionId_idx" ON "RecurringTransactionLog"("recurringTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTransactionLog_recurringTransactionId_occurrenceDa_key" ON "RecurringTransactionLog"("recurringTransactionId", "occurrenceDate");

-- CreateIndex
CREATE INDEX "Transaction_recurringTransactionId_idx" ON "Transaction"("recurringTransactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "RecurringTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransactionLog" ADD CONSTRAINT "RecurringTransactionLog_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "RecurringTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransactionLog" ADD CONSTRAINT "RecurringTransactionLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
