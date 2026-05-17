import type { FeatureKey, ProductKey } from "@renaissance/shared-types";

export type ProductManifest = {
  key: ProductKey;
  name: string;
  routeBase: string;
  standaloneDomainHint: string;
  features: FeatureKey[];
  includedProducts?: ProductKey[];
};

export const productManifests: Record<ProductKey, ProductManifest> = {
  sales: {
    key: "sales",
    name: "Sales Tracker",
    routeBase: "/sales",
    standaloneDomainHint: "sales",
    features: ["sales:create", "sales:export", "sales:dashboard"],
  },
  expenses: {
    key: "expenses",
    name: "Expense + Profit Tracker",
    routeBase: "/expenses",
    standaloneDomainHint: "expenses",
    features: ["expenses:create", "expenses:profit-report"],
  },
  invoices: {
    key: "invoices",
    name: "Invoice + Receipt Generator",
    routeBase: "/invoices",
    standaloneDomainHint: "invoices",
    features: ["invoices:create", "invoices:pdf"],
  },
  "crm-lite": {
    key: "crm-lite",
    name: "CRM Lite",
    routeBase: "/customers",
    standaloneDomainHint: "crm",
    features: ["customers:create", "customers:segments"],
  },
  reports: {
    key: "reports",
    name: "Reports Suite",
    routeBase: "/reports",
    standaloneDomainHint: "reports",
    features: ["reports:advanced", "reports:export"],
  },
  "business-os": {
    key: "business-os",
    name: "BusinessOS",
    routeBase: "/",
    standaloneDomainHint: "app",
    features: [
      "sales:create",
      "sales:export",
      "sales:dashboard",
      "expenses:create",
      "expenses:profit-report",
      "invoices:create",
      "invoices:pdf",
      "customers:create",
      "customers:segments",
      "reports:advanced",
      "reports:export",
    ],
    includedProducts: ["sales", "expenses", "invoices", "crm-lite", "reports"],
  },
};

