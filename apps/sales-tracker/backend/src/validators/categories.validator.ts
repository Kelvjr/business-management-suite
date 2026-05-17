import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategorySchemaType = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchemaType = z.infer<typeof updateCategorySchema>;
