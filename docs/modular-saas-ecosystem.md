# Modular SaaS Ecosystem Architecture

## Objective

Transform the current Sales Tracker into a modular monolith ecosystem for multi-industry SMEs. The architecture keeps one backend, one PostgreSQL database, one auth and billing core, and product modules that can be packaged as standalone SaaS products, sellable templates, white-label offers, or a combined BusinessOS suite.

This is intentionally not a microservices plan. Product boundaries are enforced through folders, package APIs, database tenancy rules, feature flags, and deployment configuration before any service split is considered.

## Current State

The existing product lives under `apps/sales-tracker`:

- `frontend`: Next.js app with dashboard, sales, categories, customers, reports, exports, settings, help, notifications, and shared UI components.
- `backend`: Express API with Prisma/PostgreSQL, sales routes, category routes, customer routes, validation, services, and seed data.
- `prisma/schema.prisma`: currently contains `Sale`, `Category`, and `Customer`.

Important migration note: the frontend currently has its own nested `.git` directory. Resolve that before monorepo package work, otherwise history, status, and tooling will be inconsistent.

## Target Repository Shape

```text
/apps
  /sales
    /app
    /components
    /lib
    package.json
  /expenses
    /app
    /components
    /lib
    package.json
  /invoices
    /app
    /components
    /lib
    package.json
  /crm-lite
    /app
    /components
    /lib
    package.json
  /reports
    /app
    /components
    /lib
    package.json
  /business-os
    /app
    /components
    /lib
    package.json

/backend
  /src
    /app
      server.ts
      middleware.ts
      router.ts
    /core
      errors.ts
      request-context.ts
      permissions.ts
      feature-gates.ts
    /modules
      /auth
      /users
      /organizations
      /sales
      /expenses
      /invoices
      /customers
      /reports
      /subscriptions
      /notifications
      /admin
    /shared
      pagination.ts
      validation.ts
      serialization.ts
  /prisma
    schema.prisma
    /migrations
  package.json

/packages
  /ui
  /auth
  /database
  /billing
  /exports
  /notifications
  /analytics
  /shared-types
  /config

/docs
  modular-saas-ecosystem.md
  migration-map.md
```

## Package Responsibilities

### `packages/ui`

Shared design system and app shell primitives:

- shadcn/Radix UI wrappers
- buttons, inputs, sheets, dialogs, tables, cards, charts
- product navigation primitives
- layout shells for standalone products and BusinessOS

Move current `frontend/components/ui`, layout components, and shared presentational components here after imports are stable.

### `packages/shared-types`

Shared TypeScript contracts:

- `Sale`, `Customer`, `Category`
- future `Expense`, `Invoice`, `Organization`, `Plan`, `FeatureKey`
- API response wrappers
- pagination/filter types

This reduces drift between Next apps and backend DTOs.

### `packages/database`

Database access wrapper:

- Prisma client singleton
- tenant-aware query helpers
- transaction helpers
- seed utilities

The Prisma schema itself should live with `/backend/prisma` unless the repo later adopts a generated database package. Early on, keep migrations close to the backend.

### `packages/auth`

Shared auth client and permission helpers:

- session shape
- role checks
- organization context
- frontend guards
- backend middleware contracts

### `packages/billing`

Billing and subscription abstractions:

- plan definitions
- feature entitlements
- usage limits
- provider adapter boundary, for example Stripe later

### `packages/exports`

Reusable export system:

- CSV
- Excel
- PDF
- invoice PDF helpers
- report export formatters

Move current `frontend/lib/exporters.ts` here first because it is already cross-product value.

### `packages/notifications`

Shared notification contracts and adapters:

- notification type definitions
- email/in-app event contracts
- provider adapter boundary
- templates later

### `packages/analytics`

Reusable calculations:

- revenue summaries
- category analytics
- margin calculations
- customer segments
- reporting aggregation helpers

Move current dashboard/report calculation logic here only after tests exist around it.

### `packages/config`

Shared repo config:

- TypeScript config presets
- ESLint config
- env schema
- route/product manifests
- feature flag defaults

## Backend Modular Monolith Design

Each backend module should expose a small internal contract:

```text
/backend/src/modules/sales
  sales.routes.ts
  sales.controller.ts
  sales.service.ts
  sales.repository.ts
  sales.validator.ts
  sales.permissions.ts
  sales.feature-gates.ts
  index.ts
```

The router imports only module `index.ts` files. Controllers handle HTTP. Services handle business rules. Repositories handle Prisma. Validators define input. Permission and feature-gate files keep monetization rules out of CRUD code.

Use API versioning readiness immediately:

```text
/api/v1/sales
/api/v1/customers
/api/v1/categories
/api/v1/reports
```

Keep existing unversioned routes during migration as compatibility aliases until all apps use `/api/v1`.

## Shared Database Strategy

Add tenancy before new modules are deeply built. Every business-owned record should belong to an organization.

Recommended core models:

```text
User
Organization
OrganizationMember
Role
Permission
Subscription
Plan
FeatureEntitlement
Notification
AuditLog

Sale
Category
Customer
Expense
Invoice
InvoiceLineItem
Receipt
```

Recommended tenancy fields:

- `organizationId` on all product records
- `createdByUserId` where user attribution matters
- `deletedAt` where recovery/audit matters
- `createdAt` and `updatedAt` consistently

Do not duplicate customer tables per product. `Customer` should be shared by Sales, CRM Lite, Invoices, and BusinessOS.

## Product Boundaries

### Sales

Owns:

- sales logging
- sales history
- categories/products/services
- sales dashboard
- daily/weekly/monthly summaries

Initial source code:

- `app/sales`
- `components/sales`
- `components/dashboard/dashboard-sales-summary.tsx`
- category API and UI
- sales service/controller/routes/validators

### Expenses

Owns:

- expense logging
- expense categories
- cost tracking
- profit and margin reports

New module. It should reuse `packages/analytics`, `packages/exports`, and shared tenancy/auth.

### Invoices

Owns:

- invoice generation
- receipts
- PDF documents
- customer billing documents
- invoice statuses

New module. It should reuse `Customer`, exports/PDF utilities, billing-adjacent primitives only where needed.

### CRM Lite

Owns:

- customer records
- purchase history
- segmentation
- search/filter

Initial source code:

- `app/customers`
- `components/customers`
- customer service/controller/routes/validators
- customer analytics currently embedded in the customers page

### Reports

Owns:

- revenue analytics
- category analytics
- payment/channel breakdown
- exportable reports

Initial source code:

- `app/reports`
- `components/reports`
- `components/dashboard/dashboard-charts.tsx`
- dashboard/report analytics helpers

### BusinessOS

Owns:

- combined operational dashboard
- cross-module insights
- role-aware navigation
- subscription tier UX
- full suite packaging

Initial source code:

- current root dashboard
- app shell/sidebar/topbar
- dashboard widgets assembled from product packages

## Monetization Architecture

Use the same codebase to support four commercial paths:

| Offer | Packaging | Backend | Database | Feature Gates |
| --- | --- | --- | --- | --- |
| Standalone templates | Export one app folder plus needed packages | Optional local/mock adapter | Optional local/dev DB | Disabled or static |
| Standalone SaaS | Deploy one product app | Shared backend | Shared DB | Product-specific plan |
| White-label product | Product app with theme/config overrides | Shared backend | Shared DB with tenant branding | Tenant and plan gates |
| BusinessOS suite | `apps/business-os` | Shared backend | Shared DB | Suite plan gates |

Define products and features as data, not scattered conditionals:

```ts
export const products = {
  sales: {
    features: ["sales:create", "sales:export", "sales:dashboard"],
  },
  expenses: {
    features: ["expenses:create", "expenses:profit-report"],
  },
  invoices: {
    features: ["invoices:create", "invoices:pdf"],
  },
  crmLite: {
    features: ["customers:create", "customers:segments"],
  },
  reports: {
    features: ["reports:advanced", "reports:export"],
  },
  businessOs: {
    includes: ["sales", "expenses", "invoices", "crmLite", "reports"],
  },
};
```

Plans then map to feature keys:

```text
sales_starter: sales only, basic exports
sales_pro: sales, advanced dashboard, exports
crm_lite: customers and purchase history
reports_pro: advanced analytics and exports
business_os_growth: all modules, team roles
business_os_scale: all modules, admin, white-label, audit logs
```

## Deployment Strategy

Early stage:

- one backend deployment
- one PostgreSQL database
- multiple frontend deployments as needed
- shared packages built locally in the monorepo

Recommended deployments:

```text
sales.example.com        -> apps/sales
expenses.example.com     -> apps/expenses
invoices.example.com     -> apps/invoices
crm.example.com          -> apps/crm-lite
reports.example.com      -> apps/reports
app.example.com          -> apps/business-os
api.example.com          -> backend
```

Each app should read a product key:

```text
NEXT_PUBLIC_PRODUCT_KEY=sales
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

The backend uses auth, organization membership, and subscription entitlements to decide what the caller can access.

## Refactor Roadmap

### Phase 1: Stabilize and Extract Shared Foundations

Goals:

- preserve current functionality
- remove scattered shared code
- prepare the repo for package extraction

Tasks:

1. Resolve nested frontend `.git` after confirming whether its history must be preserved.
2. Add root workspace config for apps/packages/backend.
3. Move the current backend from `apps/sales-tracker/backend` to `/backend` with no behavior changes.
4. Keep current frontend runnable while extracting packages gradually.
5. Create `packages/shared-types` and move API types from `frontend/lib/api.ts`.
6. Create `packages/exports` and move export helpers.
7. Create `packages/ui` and move pure UI components.
8. Add compatibility aliases so imports can be migrated incrementally.
9. Add build/lint checks for frontend and backend before each extraction.

Exit criteria:

- current Sales Tracker still runs
- backend routes behave the same
- no duplicated export/type/UI code
- package imports are working from at least one frontend app

### Phase 2: Extract Product Modules

Goals:

- turn Sales Tracker domains into product modules
- standardize API boundaries
- add tenancy primitives before building new product domains

Tasks:

1. Refactor backend into `/backend/src/modules/*`.
2. Add `/api/v1` routes while keeping temporary legacy aliases.
3. Add `Organization`, `User`, `OrganizationMember`, `Subscription`, and `FeatureEntitlement` models.
4. Add `organizationId` to `Sale`, `Category`, and `Customer`.
5. Move sales UI into `apps/sales`.
6. Move customers UI into `apps/crm-lite`.
7. Move reports UI into `apps/reports`.
8. Create thin placeholder apps for `apps/expenses` and `apps/invoices` using shared layout.
9. Add module manifests describing nav, features, permissions, and plan requirements.

Exit criteria:

- Sales, CRM Lite, and Reports can run as separate apps
- backend remains one deployment
- database remains one schema
- every product-owned record is tenant scoped
- BusinessOS can import module widgets instead of copying them

### Phase 3: Build BusinessOS and Monetization Layer

Goals:

- assemble the flagship suite
- support standalone and bundled revenue models
- prepare production SaaS operations

Tasks:

1. Build `apps/business-os` using shared app shell and module manifests.
2. Add subscription plan definitions in `packages/billing`.
3. Add backend feature gate middleware.
4. Add frontend feature gate components/hooks.
5. Add admin superuser controls for organizations, plans, users, and support access.
6. Add notifications module and event contracts.
7. Add audit logs for admin and billing-sensitive actions.
8. Add production deployment docs and env validation.
9. Add white-label config boundaries for brand, logo, colors, domains, and enabled modules.

Exit criteria:

- standalone products and BusinessOS share backend/database
- features can be enabled by plan
- products can be deployed independently
- admin and billing workflows have clear ownership

## Migration Rules

- Do not move runtime code and change behavior in the same commit.
- Prefer one domain per PR/branch: sales, customers, reports, exports, UI, backend modules.
- Keep compatibility wrappers for old imports until each app is migrated.
- Add or preserve tests around analytics and export helpers before moving them.
- Rename folders after extracting shared code, not before.
- Do not create separate databases per product.
- Do not introduce service boundaries until module contracts are stable and revenue requires it.

## Branch Strategy

Use small branches with explicit goals:

```text
codex/phase-1-workspaces
codex/phase-1-shared-types
codex/phase-1-exports-package
codex/phase-1-ui-package
codex/phase-2-backend-modules
codex/phase-2-tenancy
codex/phase-2-sales-app
codex/phase-2-crm-reports-apps
codex/phase-3-business-os
codex/phase-3-billing-gates
```

Merge order should follow dependency order: workspace config, backend relocation, shared types, exports, UI, backend modules, tenancy, product apps, BusinessOS, monetization.

