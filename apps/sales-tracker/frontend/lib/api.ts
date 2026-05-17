const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

const API_BASE_URL = API_URL.replace(/\/$/, "");

type FetchSalesParams = {
  category?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type Sale = {
  id: string;
  customerId?: string | null;
  itemType: "product" | "service";
  itemName: string;
  category?: string | null;
  subcategory?: string | null;
  quantity?: number | null;
  unitPrice?: number | string | null;
  totalAmount: number | string;
  paymentMethod?: "cash" | "card" | "bank_transfer" | "mobile_money" | "other" | null;
  paymentStatus: "paid" | "pending" | "partial" | "unpaid";
  salesChannel?:
    | "walk-in"
    | "whatsapp"
    | "instagram"
    | "phone"
    | "website"
    | null;
  customerName?: string | null;
  notes?: string | null;
  soldAt: string;
  lineItems?: SaleLineItem[];
};

export type SaleLineItem = {
  id?: string;
  itemType: "product" | "service";
  itemName: string;
  category?: string | null;
  subcategory?: string | null;
  quantity?: number;
  unitPrice: number | string;
  totalAmount: number | string;
};

export type CreateSalePayload = {
  itemType: "product" | "service";
  itemName: string;
  category?: string;
  subcategory?: string;
  quantity?: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod?: "cash" | "card" | "bank_transfer" | "mobile_money" | "other";
  paymentStatus?: "paid" | "pending" | "partial" | "unpaid";
  salesChannel?: "walk-in" | "whatsapp" | "instagram" | "phone" | "website";
  customerId?: string;
  customerName?: string;
  notes?: string;
  soldAt?: string;
  lineItems?: Omit<SaleLineItem, "id">[];
};

export type UpdateSalePayload = Partial<CreateSalePayload>;

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryPayload = {
  name: string;
  description?: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  businessName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerPayload = {
  name: string;
  email?: string;
  phone?: string;
  businessName?: string;
  notes?: string;
};

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export type Expense = {
  id: string;
  category: "Feed" | "Transport" | "Labor" | "Supplies" | "Utilities" | "Misc";
  amount: number | string;
  date: string;
  vendor?: string | null;
  notes?: string | null;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSummary = {
  totalExpenses: number;
  expenseCount: number;
  recurringExpenses: number;
  recurringCount: number;
  byCategory: { category: string; total: number; count: number }[];
};

export type ProfitSummary = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossProfit: number;
  profitMarginPercent: number;
  salesCount: number;
  expenseCount: number;
};

export type ProfitTrendPoint = {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  saleId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  lineItems: unknown;
  subtotal: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;
  paymentStatus: "paid" | "pending" | "partial" | "unpaid";
  notes?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Receipt = {
  id: string;
  saleId: string;
  receiptNumber: string;
  generatedAt: string;
  amount: number | string;
  paymentStatus: string;
  paymentMethod?: string | null;
};

export type BusinessOverview = {
  totals: ProfitSummary;
  expenses: ExpenseSummary;
  bestSellingProducts: {
    itemName: string;
    quantitySold: number;
    revenue: number;
    transactions: number;
  }[];
  topCategories: {
    category: string;
    revenue: number;
    transactions: number;
  }[];
  paymentBreakdown: {
    paymentStatus: string;
    revenue: number;
    transactions: number;
  }[];
  revenueTrend: {
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  monthlySummaries: ProfitTrendPoint[];
};

export async function fetchSalesSummary() {
  const res = await fetch(`${API_BASE_URL}/sales/summary`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch sales summary");
  }

  return res.json();
}

export async function fetchSales(params?: FetchSalesParams): Promise<Sale[]> {
  const query = new URLSearchParams();

  if (params?.category) query.set("category", params.category);
  if (params?.paymentStatus) query.set("paymentStatus", params.paymentStatus);
  if (params?.search) query.set("search", params.search);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);

  const url = `${API_BASE_URL}/sales${query.toString() ? `?${query.toString()}` : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch sales");
  }

  return res.json();
}

export async function fetchSaleById(id: string): Promise<Sale | null> {
  const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch sale");
  }

  return res.json();
}

export async function createSale(payload: CreateSalePayload) {
  const res = await fetch(`${API_BASE_URL}/sales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to create sale";

    try {
      const errorData = await res.json();
      message = errorData?.error || message;
    } catch {}

    throw new Error(message);
  }

  return res.json();
}

export async function updateSale(id: string, payload: UpdateSalePayload) {
  const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to update sale";

    try {
      const errorData = await res.json();
      message = errorData?.error || message;
    } catch {}

    throw new Error(message);
  }

  return res.json();
}

export async function deleteSale(id: string) {
  const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let message = "Failed to delete sale";

    try {
      const errorData = await res.json();
      message = errorData?.error || message;
    } catch {}

    throw new Error(message);
  }

  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createCategory(payload: CreateCategoryPayload) {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to create category";
    try {
      const errorData = await res.json();
      message = errorData?.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export async function updateCategory(id: string, payload: Partial<CreateCategoryPayload>) {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to update category";
    try {
      const errorData = await res.json();
      message = errorData?.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE_URL}/customers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const res = await fetch(`${API_BASE_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to create customer";
    try {
      const errorData = await res.json();
      message = errorData?.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export async function updateCustomer(id: string, payload: UpdateCustomerPayload) {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to update customer";
    try {
      const errorData = await res.json();
      message = errorData?.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export async function fetchExpenses(params?: {
  category?: string;
  recurring?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.recurring) query.set("recurring", params.recurring);
  if (params?.search) query.set("search", params.search);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);

  const res = await fetch(
    `${API_BASE_URL}/expenses${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function fetchExpenseSummary(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ExpenseSummary> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);

  const res = await fetch(
    `${API_BASE_URL}/expenses/summary${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch expense summary");
  return res.json();
}

export async function fetchProfitSummary(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ProfitSummary> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);

  const res = await fetch(
    `${API_BASE_URL}/profit/summary${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch profit summary");
  return res.json();
}

export async function fetchProfitTrend(params?: {
  period?: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
}): Promise<ProfitTrendPoint[]> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);

  const res = await fetch(
    `${API_BASE_URL}/profit/trend${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch profit trend");
  return res.json();
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${API_BASE_URL}/invoices`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export async function fetchReceipts(): Promise<Receipt[]> {
  const res = await fetch(`${API_BASE_URL}/receipts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch receipts");
  return res.json();
}

export async function fetchBusinessOverview(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<BusinessOverview> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);

  const res = await fetch(
    `${API_BASE_URL}/reports/overview${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch business overview");
  return res.json();
}
