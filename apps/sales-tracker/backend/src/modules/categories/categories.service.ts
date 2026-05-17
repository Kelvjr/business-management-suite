import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";
import {
  CreateCategorySchemaType,
  UpdateCategorySchemaType,
} from "./categories.validator";

export async function getAllCategories() {
  return prisma.category.findMany({
    where: { businessId: DEFAULT_BUSINESS_ID },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: CreateCategorySchemaType) {
  return prisma.category.create({
    data: {
      businessId: DEFAULT_BUSINESS_ID,
      name: data.name,
      description: data.description || null,
    },
  });
}

export async function updateCategory(id: string, data: UpdateCategorySchemaType) {
  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
    },
  });
}
