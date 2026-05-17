# Sales Tracker Migration Map

This map shows where existing code should move during the modular SaaS restructuring. It is designed for incremental refactors that keep the current product working.

## Current to Target Mapping

| Current path | Target path | Notes |
| --- | --- | --- |
| `apps/sales-tracker/backend` | `backend` | Move first with no behavior changes. |
| `apps/sales-tracker/backend/src/controllers/sales.controller.ts` | `backend/src/modules/sales/sales.controller.ts` | Move after `/backend` relocation. |
| `apps/sales-tracker/backend/src/services/sales.service.ts` | `backend/src/modules/sales/sales.service.ts` | Add repository split later. |
| `apps/sales-tracker/backend/src/routes/sales.routes.ts` | `backend/src/modules/sales/sales.routes.ts` | Mount under `/api/v1/sales`. |
| `apps/sales-tracker/backend/src/validators/sales.validator.ts` | `backend/src/modules/sales/sales.validator.ts` | Keep Zod schema names stable. |
| `apps/sales-tracker/backend/src/controllers/categories.controller.ts` | `backend/src/modules/sales/categories.controller.ts` | Categories initially belong to Sales, later may become catalog module if reused broadly. |
| `apps/sales-tracker/backend/src/controllers/customers.controller.ts` | `backend/src/modules/customers/customers.controller.ts` | Shared customer domain for CRM Lite, Sales, and Invoices. |
| `apps/sales-tracker/backend/prisma/schema.prisma` | `backend/prisma/schema.prisma` | Add tenancy models after relocation. |
| `apps/sales-tracker/frontend/components/ui` | `packages/ui/src/components` | Move pure UI first, app-specific UI later. |
| `apps/sales-tracker/frontend/components/layout` | `packages/ui/src/shell` | Keep product nav config app-owned. |
| `apps/sales-tracker/frontend/lib/exporters.ts` | `packages/exports/src/index.ts` | Good first shared package extraction. |
| `apps/sales-tracker/frontend/lib/format.ts` | `packages/ui/src/format` or `packages/shared-types/src/format` | Prefer `packages/ui` if mostly display formatting. |
| `apps/sales-tracker/frontend/lib/api.ts` | product app API clients plus `packages/shared-types` | Split types from fetch functions. |
| `apps/sales-tracker/frontend/lib/domain/dashboard-kpi-period.ts` | `packages/analytics/src/sales-kpis.ts` | Add tests before moving. |
| `apps/sales-tracker/frontend/lib/domain/dashboard-signals.ts` | `packages/analytics/src/dashboard-signals.ts` | Shared between Sales and BusinessOS. |
| `apps/sales-tracker/frontend/lib/domain/sales-analytics.ts` | `packages/analytics/src/sales-analytics.ts` | Shared by Sales and Reports. |
| `apps/sales-tracker/frontend/lib/domain/customers.ts` | `packages/analytics/src/customers.ts` or `packages/shared-types` | Put calculations in analytics, type helpers in shared-types. |
| `apps/sales-tracker/frontend/app/sales` | `apps/sales/app/sales` | Keep route shape initially. |
| `apps/sales-tracker/frontend/components/sales` | `apps/sales/components/sales` | Move product-specific components. |
| `apps/sales-tracker/frontend/app/customers` | `apps/crm-lite/app/customers` | CRM Lite owns customer screens. |
| `apps/sales-tracker/frontend/components/customers` | `apps/crm-lite/components/customers` | Extract with customer API client. |
| `apps/sales-tracker/frontend/app/reports` | `apps/reports/app/reports` | Reports app can reuse analytics package. |
| `apps/sales-tracker/frontend/components/reports` | `apps/reports/components/reports` | Product-specific report views. |
| `apps/sales-tracker/frontend/app/page.tsx` | `apps/business-os/app/page.tsx` | Combined dashboard. |
| `apps/sales-tracker/frontend/components/dashboard` | split across `apps/business-os`, `apps/sales`, `apps/reports`, `packages/analytics` | Do not move all dashboard code as one blob. |
| `apps/sales-tracker/frontend/app/settings` | `apps/business-os/app/settings` plus shared account settings later | Settings spans auth, billing, org, and product preferences. |
| `apps/sales-tracker/frontend/app/notifications` | `apps/business-os/app/notifications` | Backed by future notifications module. |
| `apps/sales-tracker/frontend/app/help` | product-specific help pages or shared docs links | Keep low priority. |

## Recommended First Implementation Sequence

1. Create root workspace config and package boundaries.
2. Move backend to `/backend` without changing imports internally.
3. Add `packages/shared-types` and move duplicated API types only.
4. Add `packages/exports` and migrate export imports.
5. Add `packages/ui` and move low-risk UI primitives.
6. Add `/api/v1` aliases in backend.
7. Split backend `src` into modules.
8. Add organization tenancy models and migration.
9. Extract `apps/sales` from the current frontend.
10. Extract `apps/crm-lite` and `apps/reports`.
11. Create `apps/business-os` as the integrated app.

## Safety Checklist Before Each Move

- Run `git status --short` and confirm unrelated changes are understood.
- Move one boundary at a time.
- Update imports mechanically.
- Run frontend lint/build for affected app.
- Run backend build for backend moves.
- Keep old routes or exports as compatibility shims until consumers are migrated.
- Avoid renaming database columns in the same migration that adds tenancy.

## Tenancy Migration Sequence

1. Add `Organization` and `User` tables.
2. Add a default organization seed for existing local data.
3. Add nullable `organizationId` to `Sale`, `Category`, and `Customer`.
4. Backfill all existing records to the default organization.
5. Make `organizationId` required.
6. Add indexes on `organizationId` and common filter fields.
7. Update all repository queries to require organization context.
8. Add request context middleware that resolves `{ userId, organizationId, role, features }`.

## Feature Gate Migration Sequence

1. Define feature keys in `packages/billing`.
2. Add backend `requireFeature(featureKey)` middleware.
3. Add frontend `useFeature(featureKey)` and `<FeatureGate />`.
4. Gate exports first because they are easy to monetize.
5. Gate advanced dashboards and reports next.
6. Gate multi-user/admin/white-label features last.

## Preserve Current Value

Keep these working throughout the migration:

- Sales CRUD
- Sales categories
- Customer records
- Customer purchase history
- Dashboard KPIs
- Reports charts
- CSV/PDF/Excel exports
- Existing mobile-responsive shell

