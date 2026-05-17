# Core Financial Backend API

Base paths are available under both legacy `/api/*` and versioned `/api/v1/*`.

## Sales

- `GET /api/v1/sales`
  - Query: `category`, `paymentStatus`, `customerName`, `search`, `startDate`, `endDate`
- `GET /api/v1/sales/summary`
- `GET /api/v1/sales/:id`
- `POST /api/v1/sales`
  - Supports the existing single-item payload.
  - Also supports `lineItems: [{ itemType, itemName, category, subcategory, quantity, unitPrice, totalAmount }]`.
  - Supports `customerId`, `paymentMethod`, and `paymentStatus: paid | pending | partial | unpaid`.
- `PATCH /api/v1/sales/:id`
- `DELETE /api/v1/sales/:id`

## Expenses

- `GET /api/v1/expenses`
  - Query: `category`, `recurring=true|false`, `search`, `startDate`, `endDate`
- `GET /api/v1/expenses/summary`
- `GET /api/v1/expenses/:id`
- `POST /api/v1/expenses`
  - Body: `category`, `amount`, optional `date`, `vendor`, `notes`, `recurring`
  - Categories: `Feed`, `Transport`, `Labor`, `Supplies`, `Utilities`, `Misc`
- `PATCH /api/v1/expenses/:id`
- `DELETE /api/v1/expenses/:id`

## Profit

- `GET /api/v1/profit/summary`
  - Query: `startDate`, `endDate`
  - Returns total revenue, total expenses, net profit, gross profit, profit margin, sale count, expense count.
- `GET /api/v1/profit/trend`
  - Query: `period=daily|weekly|monthly`, `startDate`, `endDate`
- `POST /api/v1/profit/snapshots`
  - Stores/updates today’s profit snapshot.

## Invoices

- `GET /api/v1/invoices`
- `GET /api/v1/invoices/:id`
- `GET /api/v1/invoices/:id/print`
- `POST /api/v1/invoices`
  - Either pass `saleId` to generate from a sale, or pass manual `lineItems`.
  - Supports `customerId`, customer details, `tax`, `discount`, `paymentStatus`, `notes`, `dueDate`.
- `PATCH /api/v1/invoices/:id`

## Receipts

- `GET /api/v1/receipts`
- `GET /api/v1/receipts/:id`
- `GET /api/v1/receipts/:id/print`
- `POST /api/v1/receipts`
  - Body: `{ "saleId": "..." }`

## Customers

- `GET /api/v1/customers`
- `GET /api/v1/customers/:id`
- `GET /api/v1/customers/:id/purchases`
- `POST /api/v1/customers`
- `PATCH /api/v1/customers/:id`

## Dashboard And Reports

- `GET /api/v1/reports/overview`
- `GET /api/v1/dashboard/overview`
  - Returns revenue, expenses, net profit, best sellers, top categories, payment breakdown, daily revenue/profit trend, monthly summaries.
- `GET /api/v1/reports/exports/:type?format=csv|excel`
  - Types: `sales`, `expenses`, `profit`, `tax-summary`
  - `excel` returns an Excel-compatible tab-delimited `.xls` response.

## Internal Context

Auth is intentionally not implemented yet. All records are assigned to `default-business`, with a seeded `default-owner` internal user. This keeps the data model multi-tenant-ready without blocking the pilot MVP.

- `GET /api/v1/internal/context`
  - Returns the temporary default business/user context and confirms admin override mode is active.
