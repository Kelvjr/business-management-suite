const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

type FetchSalesParams = {
  category?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type Sale = {
  id: string;
  itemType: "product" | "service";
  itemName: string;
  category?: string | null;
  subcategory?: string | null;
  quantity?: number | null;
  unitPrice?: number | string | null;
  totalAmount: number | string;
  paymentStatus: "paid" | "partial" | "unpaid";
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
};

export type CreateSalePayload = {
  itemType: "product" | "service";
  itemName: string;
  category?: string;
  subcategory?: string;
  quantity?: number;
  unitPrice: number;
  totalAmount: number;
  paymentStatus?: "paid" | "partial" | "unpaid";
  salesChannel?: "walk-in" | "whatsapp" | "instagram" | "phone" | "website";
  customerName?: string;
  notes?: string;
  soldAt?: string;
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

export async function fetchSalesSummary() {
  const res = await fetch(`${API_URL}/sales/summary`, {
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

  const url = `${API_URL}/sales${query.toString() ? `?${query.toString()}` : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch sales");
  }

  return res.json();
}

export async function fetchSaleById(id: string): Promise<Sale | null> {
  const res = await fetch(`${API_URL}/sales/${id}`, {
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
  const res = await fetch(`${API_URL}/sales`, {
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
  const res = await fetch(`${API_URL}/sales/${id}`, {
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
  const res = await fetch(`${API_URL}/sales/${id}`, {
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
  const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createCategory(payload: CreateCategoryPayload) {
  const res = await fetch(`${API_URL}/categories`, {
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
  const res = await fetch(`${API_URL}/categories/${id}`, {
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
  const res = await fetch(`${API_URL}/customers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const res = await fetch(`${API_URL}/customers`, {
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
  const res = await fetch(`${API_URL}/customers/${id}`, {
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
