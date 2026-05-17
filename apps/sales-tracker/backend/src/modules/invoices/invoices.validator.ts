import { z } from "zod";

const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
});

export const createInvoiceSchema = z.object({
  saleId: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().optional(),
  customerEmail: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  lineItems: z.array(invoiceLineItemSchema).min(1).optional(),
  tax: z.number().nonnegative().optional().default(0),
  discount: z.number().nonnegative().optional().default(0),
  paymentStatus: z
    .enum(["paid", "pending", "partial", "unpaid"])
    .optional()
    .default("pending"),
  notes: z.string().trim().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export type CreateInvoiceSchemaType = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceSchemaType = z.infer<typeof updateInvoiceSchema>;
export type InvoiceLineItemSchemaType = z.infer<typeof invoiceLineItemSchema>;

