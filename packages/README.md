# Packages

Shared packages for the modular monolith:

- `ui`: shared UI primitives, layouts, and shell components.
- `auth`: auth types, guards, and permission helpers.
- `database`: Prisma client wrapper, tenant helpers, and database utilities.
- `billing`: plans, feature gates, entitlements, and billing provider boundaries.
- `exports`: CSV, Excel, PDF, invoice, receipt, and report export helpers.
- `notifications`: notification contracts and provider adapters.
- `analytics`: reusable revenue, customer, margin, and report calculations.
- `shared-types`: shared DTOs, API contracts, and product/domain types.
- `config`: shared TypeScript, ESLint, env, and product manifest config.

Add packages incrementally. Do not move runtime code here until imports and tests are ready for that package boundary.

