# Consolidation and verification report

Date: 2026-08-12

## 1. What was audited

The complete Next.js frontend, Express API, Prisma schema, all migrations,
seeders, routes, services, validators, API clients, page wiring, dependencies,
demo fallback behavior, and current uncommitted payment/module work.

## 2. Duplicate and dead code found

- An unused legacy dashboard component.
- Six obsolete module-page copies in `connected-module-pages.tsx`.
- Older purchase and invoice implementations in `operational-module-pages.tsx`.
- A supplier opening-balance form backed by a stored value that purchase payments
  did not maintain.

## 3. Removed or consolidated

- Removed the unused dashboard and obsolete connected-module file.
- Removed old purchase/invoice page exports.
- Moved reports into a focused reports component.
- Moved Express application construction out of the process entry point so the
  real API can be exercised in automated tests.
- Centralized money/payment and inventory calculations in domain modules.
- Replaced stored supplier balance with a value derived from purchases.
- Separated create defaults from partial-update validation.

## 4. Bugs found

- Partial sale edits injected create defaults and could mark an unpaid sale paid.
- Sale item edits did not reconcile inventory.
- Opening sale payments were missing from payment history.
- Later sale payments ignored legacy/stored paid totals.
- Expense overpayments were silently reduced to the expense total.
- Supplier balances could disagree across screens.
- Invoices created from the customer picker were not linked to the customer.
- Catalog quantity edits and opening stock did not create inventory history.
- Received purchases could be reopened into an inconsistent state.
- Paid invoices and purchases could be deleted while leaving detached payments.
- API errors lost the backend's useful message.
- Production API failures could silently show editable demo data.
- The Payments navigation destination was a visual placeholder.
- Payment events detached by document deletion did not always retain a reference.
- The mobile navigation button had no accessible name.

## 5. Bugs fixed

All items above were fixed. Financial changes append payment events; sale edits
reconcile stock transactionally; payment history retains document references;
unsafe deletes return conflicts; and catalog/supplier/customer history is guarded.

## 6. Tests added

- Money rounding and payment-state tests.
- Overpayment and payment-reduction tests.
- Inventory movement and sale-edit reconciliation tests.
- Expense payment-state tests.
- Quick and itemized sale total, discount, and tax tests.
- Partial-update default regression tests.
- A database-backed HTTP scenario covering customer, product, sale edit,
  attachments/custom fields, partial/final/overpayment, expense update and
  recurrence fields, supplier purchase receipt, three purchase payments, three
  invoice payments, customer totals, and stock restoration.

## 7–9. Executed tests and build results

- Domain/service/validator suite: 16 passed; the opt-in database test was skipped
  in the default run as designed.
- Database-backed integration suite: 1 passed.
- Backend TypeScript production build: passed.
- Frontend ESLint: passed.
- Frontend TypeScript and Next.js production build: passed; all 23 routes built.
- Browser smoke pass: 17 major routes loaded against the real backend with no
  visible request error and no browser console warning.
- Mobile viewport checks: dashboard and payments rendered; mobile navigation
  accessibility issue found and fixed.

## 10. Database and migration status

- Prisma schema validates.
- Eight migrations are applied; the configured database is up to date.
- The new migration adds a strict purchase-status type, removes the duplicated
  supplier balance column, and adds positive/nonnegative quantity/payment checks.
- Integration test records are removed by exact IDs/references; verified residue
  count is zero.

## 11. Remaining technical debt

- Several secondary destinations (activity, alerts, sales channels/returns and
  some dynamic detail/report/settings views) are informative workspace screens,
  not dedicated backend modules.
- There is no frontend component-test framework; frontend verification is lint,
  production build, browser route smoke tests, and API-backed workflows.
- Lists generally load bounded or complete datasets without user pagination.
- Large operational UI files should continue to be split gradually.
- Purchase and invoice creation currently support one line item, as the UI states.
- Expense payments use expense totals/status rather than the shared payment ledger.
- Hard sale deletion is retained for current UX; a future cancellation/reversal
  model would provide a stronger accounting audit trail.
- Stock updates are transactional but should use stronger concurrency controls
  before many staff can sell the same product simultaneously.

## 12. Remaining security concerns

- There is intentionally no authentication, authorization, or tenant isolation.
- Uploads are stored locally and served publicly by URL.
- Rate limiting, security headers, CSRF strategy, request/audit identity, and
  production CORS policy are not yet implemented.
- Secrets and production database permissions still require deployment hardening.

## 13. Before authentication

No further blocking cleanup is required to begin the authentication phase. Before
real multi-user rollout, decide the sale cancellation/reversal policy and add
concurrency-safe stock updates. Do not add tenant IDs until authenticated business
membership can be resolved and enforced by the server.

## 14. Readiness

The codebase is ready to begin authentication and tenant-isolation work as the
next engineering phase. It is not yet production-ready as a secure multi-tenant
service; the security and concurrency items above must be completed as part of
that phase.
