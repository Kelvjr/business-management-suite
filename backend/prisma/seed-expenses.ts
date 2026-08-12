import "dotenv/config";
import { PaymentMethod, PaymentStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const today = new Date();
const date = (daysAgo: number) => { const value = new Date(today); value.setDate(value.getDate() - daysAgo); value.setHours(10 + (daysAgo % 6), (daysAgo * 11) % 60, 0, 0); return value; };
const next = (daysAhead: number) => { const value = new Date(today); value.setDate(value.getDate() + daysAhead); value.setHours(9, 0, 0, 0); return value; };

const rows = [
  ["Wholesale produce stock", "Inventory & supplies", 2450, "Makola Fresh Foods", 1, PaymentMethod.MOBILE_MONEY, true, null, null],
  ["Studio rent", "Rent & utilities", 3200, "Apex Properties", 3, PaymentMethod.BANK_TRANSFER, true, "MONTHLY", 27],
  ["Electricity prepaid", "Rent & utilities", 680, "ECG", 5, PaymentMethod.MOBILE_MONEY, true, "MONTHLY", 25],
  ["Delivery fuel", "Transport", 420, "Vivo Energy", 7, PaymentMethod.CARD, true, null, null],
  ["Social media campaign", "Marketing", 1250, "Meta Platforms", 10, PaymentMethod.CARD, true, null, null],
  ["Casual staff wages", "Payroll", 2850, "Operations team", 12, PaymentMethod.MOBILE_MONEY, false, "MONTHLY", 18],
  ["POS printer", "Equipment", 1450, "Accra Office Mart", 15, PaymentMethod.BANK_TRANSFER, true, null, null],
  ["Bookkeeping support", "Professional services", 900, "ClearLedger GH", 18, PaymentMethod.BANK_TRANSFER, true, "MONTHLY", 12],
  ["Business internet", "Rent & utilities", 540, "Telecel Ghana", 22, PaymentMethod.MOBILE_MONEY, true, "MONTHLY", 8],
  ["Packaging materials", "Inventory & supplies", 780, "Kaneshie Packaging", 26, PaymentMethod.CASH, false, null, null],
  ["GRA filing fee", "Taxes & fees", 600, "Ghana Revenue Authority", 34, PaymentMethod.BANK_TRANSFER, true, "QUARTERLY", 55],
  ["Client meeting lunch", "Meals", 360, "Buka Restaurant", 39, PaymentMethod.CARD, true, null, null],
  ["Previous month rent", "Rent & utilities", 3200, "Apex Properties", 42, PaymentMethod.BANK_TRANSFER, true, "MONTHLY", 27],
  ["Previous month stock", "Inventory & supplies", 2180, "Makola Fresh Foods", 47, PaymentMethod.MOBILE_MONEY, true, null, null],
  ["Courier deliveries", "Transport", 510, "Swift Dispatch", 51, PaymentMethod.MOBILE_MONEY, false, null, null],
  ["Design software", "Professional services", 720, "Adobe", 58, PaymentMethod.CARD, true, "MONTHLY", 4],
] as const;

async function main() {
  for (const [index, row] of rows.entries()) {
    const [description, category, amount, vendor, daysAgo, paymentMethod, hasReceipt, recurrence, dueIn] = row;
    const reference = `EXP-MOCK-${String(index + 1).padStart(3, "0")}`;
    await prisma.expense.upsert({ where: { reference }, update: {}, create: {
      reference, description, category, amount, vendor, paymentMethod, paymentStatus: PaymentStatus.PAID, amountPaid: amount, balanceDue: 0,
      incurredAt: date(daysAgo), isRecurring: Boolean(recurrence), recurrence, nextDueAt: dueIn ? next(dueIn) : null,
      notes: "Mock expense for dashboard exploration", customFields: { source: "mock" },
      attachments: hasReceipt ? { create: { bucket: "legacy", originalName: `${reference.toLowerCase()}-receipt.pdf`, mimeType: "application/pdf", size: 84200 + daysAgo * 120, storageKey: "#mock-receipt", visibility: "PRIVATE" } } : undefined,
      activity: { create: { action: "CREATED", summary: "Mock expense added" } },
    } });
  }
}

main().finally(() => prisma.$disconnect());
