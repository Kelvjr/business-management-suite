ALTER TABLE "Expense" ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Expense" ADD COLUMN "recurrence" TEXT;
ALTER TABLE "Expense" ADD COLUMN "nextDueAt" TIMESTAMP(3);
CREATE INDEX "Expense_isRecurring_nextDueAt_idx" ON "Expense"("isRecurring", "nextDueAt");
