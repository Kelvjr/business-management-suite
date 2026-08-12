import { z } from "zod";

const expenseShape = {
  reference: z.string().trim().min(2).max(80).optional().nullable(), vendor: z.string().trim().max(120).optional().nullable(), description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80),
  amount: z.coerce.number().positive().max(999_999_999), paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_MONEY", "OTHER"]), paymentStatus: z.enum(["PAID", "PARTIALLY_PAID", "UNPAID"]),
  amountPaid: z.coerce.number().nonnegative().max(999_999_999), incurredAt: z.coerce.date(), notes: z.string().trim().max(2_000).optional().nullable(), customFields: z.record(z.string(), z.string()),
  isRecurring: z.boolean(), recurrence: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional().nullable(), nextDueAt: z.coerce.date().optional().nullable(),
};
export const expenseInputSchema = z.object({ ...expenseShape, paymentStatus: expenseShape.paymentStatus.default("PAID"), amountPaid: expenseShape.amountPaid.default(0), customFields: expenseShape.customFields.default({}), isRecurring: expenseShape.isRecurring.default(false) });
export const expenseUpdateSchema = z.object(expenseShape).partial();
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
