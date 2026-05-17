import { z } from "zod";

const saleLineItemSchema = z.object({
  itemType: z.enum(["product", "service"]),
  itemName: z.string().trim().min(1, "Item name is required"),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  quantity: z.number().int().positive().optional().default(1),
  unitPrice: z.number().positive("Unit price must be greater than 0"),
  totalAmount: z.number().positive("Total amount must be greater than 0"),
});

export const createSaleSchema = z.object({
  itemType: z.enum(["product", "service"]),
  itemName: z.string().trim().min(1, "Item name is required"),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  quantity: z.number().int().positive().optional().default(1),
  unitPrice: z.number().positive("Unit price must be greater than 0"),
  totalAmount: z.number().positive("Total amount must be greater than 0"),
  paymentMethod: z
    .enum(["cash", "card", "bank_transfer", "mobile_money", "other"])
    .optional(),
  paymentStatus: z
    .enum(["paid", "pending", "partial", "unpaid"])
    .optional()
    .default("paid"),
  salesChannel: z
    .enum(["walk-in", "whatsapp", "instagram", "phone", "website"])
    .optional(),
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  soldAt: z.string().datetime().optional(),
  lineItems: z.array(saleLineItemSchema).min(1).optional(),
});

export const updateSaleSchema = createSaleSchema.partial();

export type CreateSaleSchemaType = z.infer<typeof createSaleSchema>;
export type UpdateSaleSchemaType = z.infer<typeof updateSaleSchema>;
export type SaleLineItemSchemaType = z.infer<typeof saleLineItemSchema>;
