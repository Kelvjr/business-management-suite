import { z } from "zod";

const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(1).max(120),
  size: z.number().int().nonnegative().max(15_000_000), url: z.string().min(1).max(2_000),
});

export const expenseInputSchema = z.object({
  reference: z.string().trim().min(2).max(80).optional().nullable(),
  vendor: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().min(1).max(180),
  category: z.string().trim().min(1).max(80),
  amount: z.coerce.number().positive().max(999_999_999),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_MONEY", "OTHER"]),
  paymentStatus: z.enum(["PAID", "PARTIALLY_PAID", "UNPAID"]).default("PAID"),
  amountPaid: z.coerce.number().nonnegative().max(999_999_999).default(0),
  incurredAt: z.coerce.date(),
  notes: z.string().trim().max(2_000).optional().nullable(),
  customFields: z.record(z.string(), z.string()).default({}),
  attachments: z.array(attachmentSchema).max(10).default([]),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional().nullable(),
  nextDueAt: z.coerce.date().optional().nullable(),
});

export const expenseUpdateSchema = expenseInputSchema.partial();
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
