import { z } from "zod";

const paymentMethods = ["CASH", "CARD", "BANK_TRANSFER", "MOBILE_MONEY", "OTHER"] as const;
const saleTypes = ["PRODUCT", "SERVICE", "PACKAGE", "CUSTOM"] as const;
const pricingMethods = ["FIXED", "PER_ITEM", "BY_WEIGHT", "BY_VOLUME", "PER_HOUR", "PER_DAY", "PER_PERSON", "CUSTOM_UNIT"] as const;
const discountTypes = ["NONE", "FIXED", "PERCENTAGE"] as const;
const paymentStatuses = ["PAID", "PARTIALLY_PAID", "UNPAID"] as const;

export const saleItemSchema = z.object({
  catalogItemId: z.string().optional().nullable(), name: z.string().trim().min(1).max(180), type: z.enum(saleTypes), pricingMethod: z.enum(pricingMethods),
  measurement: z.coerce.number().positive().max(999_999_999).optional().nullable(), unit: z.string().trim().max(40).optional().nullable(),
  rate: z.coerce.number().nonnegative().max(999_999_999), lineTotal: z.coerce.number().nonnegative().max(999_999_999), manualTotalOverride: z.boolean().optional(),
});

const customerSchema = z.object({ id: z.string().optional(), name: z.string().trim().min(1).max(120), phone: z.string().trim().max(40).optional().nullable(), email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")) });

const saleShape = {
  reference: z.string().trim().min(2).max(80).optional().nullable(), customerName: z.string().trim().max(120).optional().nullable(), customer: customerSchema.optional().nullable(),
  description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80), amount: z.coerce.number().positive().max(999_999_999), paymentMethod: z.enum(paymentMethods),
  type: z.enum(saleTypes), pricingMethod: z.enum(pricingMethods), measurement: z.coerce.number().positive().optional().nullable(), unit: z.string().trim().max(40).optional().nullable(), rate: z.coerce.number().nonnegative().optional().nullable(),
  items: z.array(saleItemSchema).min(1).max(100).optional(), discountType: z.enum(discountTypes), discountValue: z.coerce.number().nonnegative().max(999_999_999), taxRate: z.coerce.number().min(0).max(100),
  manualTotalOverride: z.boolean(), paymentStatus: z.enum(paymentStatuses), amountPaid: z.coerce.number().nonnegative().max(999_999_999).optional(), soldAt: z.coerce.date(), notes: z.string().trim().max(2_000).optional().nullable(),
  customFields: z.record(z.string(), z.string()),
};

export const saleInputSchema = z.object({ ...saleShape,
  type: saleShape.type.default("CUSTOM"), pricingMethod: saleShape.pricingMethod.default("FIXED"), discountType: saleShape.discountType.default("NONE"), discountValue: saleShape.discountValue.default(0),
  taxRate: saleShape.taxRate.default(0), manualTotalOverride: saleShape.manualTotalOverride.default(false), paymentStatus: saleShape.paymentStatus.default("PAID"), customFields: saleShape.customFields.default({}),
});
export const saleUpdateSchema = z.object(saleShape).partial();
export type SaleInput = z.infer<typeof saleInputSchema>;
export type SaleUpdateInput = z.infer<typeof saleUpdateSchema>;
