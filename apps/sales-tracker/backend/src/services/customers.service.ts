import { prisma } from "../lib/prisma";
import {
  CreateCustomerSchemaType,
  UpdateCustomerSchemaType,
} from "../validators/customers.validator";

export async function getAllCustomers() {
  return prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(data: CreateCustomerSchemaType) {
  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      businessName: data.businessName || null,
      notes: data.notes || null,
    },
  });
}

export async function updateCustomer(id: string, data: UpdateCustomerSchemaType) {
  return prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.businessName !== undefined && {
        businessName: data.businessName || null,
      }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
  });
}
