import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  businessName: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerSchemaType = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchemaType = z.infer<typeof updateCustomerSchema>;
