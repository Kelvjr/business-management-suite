# Backend

Target home for the shared modular monolith backend.

The current backend remains in `apps/sales-tracker/backend` until the Phase 1 relocation. After relocation, the backend should expose one Express API backed by one Prisma schema and one PostgreSQL database.

Planned module structure:

```text
backend/src/modules/auth
backend/src/modules/users
backend/src/modules/organizations
backend/src/modules/sales
backend/src/modules/expenses
backend/src/modules/invoices
backend/src/modules/customers
backend/src/modules/reports
backend/src/modules/subscriptions
backend/src/modules/notifications
backend/src/modules/admin
```

All product modules must receive organization context and enforce role, permission, and feature gates before data access.

