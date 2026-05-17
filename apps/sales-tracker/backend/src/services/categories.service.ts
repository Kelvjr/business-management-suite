import { prisma } from "../lib/prisma";
import {
  CreateCategorySchemaType,
  UpdateCategorySchemaType,
} from "../validators/categories.validator";

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: CreateCategorySchemaType) {
  return prisma.category.create({
    data: {
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
