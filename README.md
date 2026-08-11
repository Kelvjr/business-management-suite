# Renaissance Management Suite

The first module answers one question: **How much money did my business make?**

## Management suite pages

- `/` — focused business overview with revenue, expenses, profit, invoices, stock alerts, and recent activity
- `/sales` — complete searchable and filterable sales workspace
- `/sales/new` — progressive record-sale page for quick or itemized sales
- `/sales/[id]` — clickable sale record with edit and delete actions
- `/expenses` — spending overview, charts, filters, exports, and expense management
- `/expenses/new` — record paid, partly paid, or unpaid expenses with receipt attachments
- `/catalog` — reusable products and services with pricing, SKU, stock, duration, and assigned staff
- `/customers` — customer profiles with spend, order, last-purchase, favorite-item, and average-order analytics
- `/inventory` — stock levels, low-stock alerts, stock movements, and history
- `/suppliers` — supplier contacts, supplied products, balances, terms, and purchase history
- `/purchases` — purchase orders, received quantities, bills, balances, and supplier payments
- `/purchases/new` — create a purchase order and receive its stock into inventory
- `/invoices` — invoice status, due dates, payments, and outstanding balances
- `/invoices/new` — create an itemized customer invoice
- `/reports` — sales, product, customer, profit, expense, inventory, and tax reporting hub
- `/settings` — business, currency, sale custom fields, reporting, and notification preferences
- `/help` — searchable help center and support contact

## Project structure

- `management_suite` — Next.js, Tailwind CSS, and shadcn/ui dashboard
- `backend` — Node.js, Express, PostgreSQL, and Prisma API

## Start the dashboard now

The interface falls back to labeled demo data until the API is connected.

```powershell
cd management_suite
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Connect PostgreSQL when ready

1. Create a PostgreSQL database named `renaissance_sales`.
2. In `backend`, copy `.env.example` to `.env` and update `DATABASE_URL` with your PostgreSQL username and password.
3. Install packages and create the database tables:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run prisma:deploy
npm run db:seed
npm run db:seed:expenses
npm run db:seed:suite
npm run dev
```

The API runs at `http://localhost:4000`; reload the dashboard and the **Demo data** badge will disappear.

When new database migrations are added later, run `npm run prisma:deploy` from `backend` before restarting the API.

## Record a sale

Use **Quick sale** for a name and total such as `Peppers — GH₵450`, or select a saved product, enter its quantity, and finish. Switch to **Detailed sale** when you need multiple items, custom units, per-unit pricing, discounts, tax, partial payments, customer details, attachments, and business-specific custom fields. Linked products reduce inventory automatically; deleting the sale restores their stock.

Currency is display formatting, not exchange-rate conversion. Changing it in Settings updates dashboard, sale, receipt, CSV, and PDF formatting; existing numeric amounts are not converted.

Uploaded supporting files are stored in `backend/uploads` for local development. Before production deployment, move this storage to a durable private object-storage provider and add authenticated download access.

## Expenses module

Expenses answers **How much did my business spend?** It tracks vendors, categories, payment methods and status, outstanding balances, dates, references, notes, and supporting receipts. The overview includes a 30-day spending trend and current-month category mix. This data is structured so the next Profit module can calculate revenue minus expenses.

The expanded dashboard also shows current profit, largest expense, six-month revenue-versus-expense comparison, vendor totals, receipt coverage, and recurring expenses with their next due dates. The included mock data can be safely added again without duplication with `npm run db:seed:expenses` from `backend`.

## Useful commands

- `npm run prisma:studio` in `backend` opens a safe visual database editor.
- `npm run build` in either directory verifies a production build.
- CSV and PDF exports are generated in the browser from the currently filtered sales.
