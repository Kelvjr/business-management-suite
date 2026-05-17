import { z } from "zod";

export const expenseCategorySchema = z.enum([
  "Feed",
  "Transport",
  "Labor",
  "Supplies",
  "Utilities",
  "Misc",
]);

export const createExpenseSchema = z.object({
  category: expenseCategorySchema,
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().datetime().optional(),
  vendor: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  recurring: z.boolean().optional().default(false),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseSchemaType = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseSchemaType = z.infer<typeof updateExpenseSchema>;

