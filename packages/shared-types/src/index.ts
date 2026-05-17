export type ProductKey =
  | "sales"
  | "expenses"
  | "invoices"
  | "crm-lite"
  | "reports"
  | "business-os";

export type FeatureKey =
  | "sales:create"
  | "sales:export"
  | "sales:dashboard"
  | "expenses:create"
  | "expenses:profit-report"
  | "invoices:create"
  | "invoices:pdf"
  | "customers:create"
  | "customers:segments"
  | "reports:advanced"
  | "reports:export"
  | "admin:organizations"
  | "admin:billing"
  | "white-label:branding";

export type RoleKey = "owner" | "admin" | "manager" | "member" | "viewer";

export type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type TenantContext = {
  userId: string;
  organizationId: string;
  role: RoleKey;
  features: FeatureKey[];
};

export type SaleDto = {
  id: string;
  organizationId: string;
  itemType: "product" | "service";
  itemName: string;
  category?: string | null;
  subcategory?: string | null;
  quantity: number;
  unitPrice: number | string;
  totalAmount: number | string;
  paymentStatus: "paid" | "partial" | "unpaid";
  salesChannel?: "walk-in" | "whatsapp" | "instagram" | "phone" | "website" | null;
  customerName?: string | null;
  notes?: string | null;
  soldAt: string;
};

export type CustomerDto = {
  id: string;
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  businessName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDto = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

