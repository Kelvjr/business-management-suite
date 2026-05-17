import type { FeatureKey, ProductKey } from "@renaissance/shared-types";

export type PlanKey =
  | "sales_starter"
  | "sales_pro"
  | "crm_lite"
  | "reports_pro"
  | "business_os_growth"
  | "business_os_scale";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  products: ProductKey[];
  features: FeatureKey[];
  whiteLabel: boolean;
  maxUsers: number | "unlimited";
};

export const plans: Record<PlanKey, PlanDefinition> = {
  sales_starter: {
    key: "sales_starter",
    name: "Sales Starter",
    products: ["sales"],
    features: ["sales:create", "sales:dashboard"],
    whiteLabel: false,
    maxUsers: 1,
  },
  sales_pro: {
    key: "sales_pro",
    name: "Sales Pro",
    products: ["sales"],
    features: ["sales:create", "sales:dashboard", "sales:export"],
    whiteLabel: false,
    maxUsers: 5,
  },
  crm_lite: {
    key: "crm_lite",
    name: "CRM Lite",
    products: ["crm-lite"],
    features: ["customers:create", "customers:segments"],
    whiteLabel: false,
    maxUsers: 3,
  },
  reports_pro: {
    key: "reports_pro",
    name: "Reports Pro",
    products: ["reports"],
    features: ["reports:advanced", "reports:export"],
    whiteLabel: false,
    maxUsers: 3,
  },
  business_os_growth: {
    key: "business_os_growth",
    name: "BusinessOS Growth",
    products: ["business-os", "sales", "expenses", "invoices", "crm-lite", "reports"],
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
    whiteLabel: false,
    maxUsers: 10,
  },
  business_os_scale: {
    key: "business_os_scale",
    name: "BusinessOS Scale",
    products: ["business-os", "sales", "expenses", "invoices", "crm-lite", "reports"],
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
      "admin:organizations",
      "admin:billing",
      "white-label:branding",
    ],
    whiteLabel: true,
    maxUsers: "unlimited",
  },
};

export function planHasFeature(planKey: PlanKey, feature: FeatureKey) {
  return plans[planKey].features.includes(feature);
}

