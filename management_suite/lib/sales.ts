export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_MONEY" | "OTHER";
export type SaleType = "PRODUCT" | "SERVICE" | "PACKAGE" | "CUSTOM";
export type PricingMethod = "FIXED" | "PER_ITEM" | "BY_WEIGHT" | "BY_VOLUME" | "PER_HOUR" | "PER_DAY" | "PER_PERSON" | "CUSTOM_UNIT";
export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID";
export type DiscountType = "NONE" | "FIXED" | "PERCENTAGE";

export type SaleItem = { id?: string; catalogItemId?: string | null; name: string; type: SaleType; pricingMethod: PricingMethod; measurement?: number | null; unit?: string | null; rate: number; lineTotal: number; manualTotalOverride: boolean };
export type Customer = { id: string; name: string; phone?: string | null; email?: string | null; address?:string|null; birthday?:string|null; notes?:string|null; _count?: { sales: number } };
export type SaleAttachment = { id?: string; name: string; mimeType: string; size: number; url: string };
export type SaleActivity = { id: string; action: string; summary: string; changes?: Record<string, unknown> | null; createdAt: string };

export type Sale = {
  id: string;
  reference: string;
  customerName: string | null;
  description: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  soldAt: string;
  notes?: string | null;
  type?: SaleType;
  pricingMethod?: PricingMethod;
  measurement?: number | null;
  unit?: string | null;
  rate?: number | null;
  subtotal?: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  manualTotalOverride?: boolean;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  balanceDue?: number;
  customFields?: Record<string, string>;
  customer?: Customer | null;
  items?: SaleItem[];
  attachments?: SaleAttachment[];
  activity?: SaleActivity[];
};

export type SaleInput = {
  reference?: string | null;
  customerName?: string | null;
  customer?: { id?: string; name: string; phone?: string | null; email?: string | null } | null;
  description: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  soldAt: string;
  notes?: string | null;
  type?: SaleType;
  pricingMethod?: PricingMethod;
  measurement?: number | null;
  unit?: string | null;
  rate?: number | null;
  items?: SaleItem[];
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
  manualTotalOverride?: boolean;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  customFields?: Record<string, string>;
};

const demoRows = [
  ["Northstar Studio", "Brand strategy session", "Services", 2460, "BANK_TRANSFER"],
  ["Atlas Coffee", "Website care plan", "Subscriptions", 780, "CARD"],
  ["Walk-in customer", "Retail product order", "Products", 1245, "CASH"],
  ["Lumen Works", "Team workshop", "Services", 3100, "BANK_TRANSFER"],
  ["Cedar House", "Digital template pack", "Digital", 349, "CARD"],
  ["Marble & Co.", "Consulting retainer", "Subscriptions", 1800, "MOBILE_MONEY"],
  ["Northstar Studio", "Campaign add-on", "Services", 920, "CARD"],
  ["Atlas Coffee", "Retail product order", "Products", 640, "CASH"],
  ["Lumen Works", "Digital template pack", "Digital", 249, "CARD"],
  ["Cedar House", "Brand strategy session", "Services", 1650, "BANK_TRANSFER"],
  ["Marble & Co.", "Website care plan", "Subscriptions", 520, "CARD"],
  ["Walk-in customer", "Retail product order", "Products", 890, "CASH"],
] as const;

export function makeDemoSales(): Sale[] {
  const now = new Date();
  return demoRows.map((row, index) => {
    const soldAt = new Date(now);
    soldAt.setDate(now.getDate() - index);
    soldAt.setHours(9 + (index % 8), (index * 11) % 60, 0, 0);
    return {
      id: `demo-${index + 1}`,
      reference: `SAL-${now.getFullYear()}-${String(1248 - index).padStart(4, "0")}`,
      customerName: row[0], description: row[1], category: row[2], amount: row[3],
      paymentMethod: row[4] as PaymentMethod, soldAt: soldAt.toISOString(),
    };
  });
}

export const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Cash", CARD: "Card", BANK_TRANSFER: "Bank transfer", MOBILE_MONEY: "Mobile money", OTHER: "Other",
};

export const saleTypeLabels: Record<SaleType, string> = { PRODUCT: "Product", SERVICE: "Service", PACKAGE: "Package", CUSTOM: "Custom" };
export const pricingMethodLabels: Record<PricingMethod, string> = { FIXED: "Fixed amount", PER_ITEM: "Per item", BY_WEIGHT: "By weight", BY_VOLUME: "By volume", PER_HOUR: "Per hour", PER_DAY: "Per day", PER_PERSON: "Per person", CUSTOM_UNIT: "Custom unit" };
export const paymentStatusLabels: Record<PaymentStatus, string> = { PAID: "Paid", PARTIALLY_PAID: "Partially paid", UNPAID: "Unpaid" };

export function todayInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
