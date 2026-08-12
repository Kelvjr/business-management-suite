# Single-business consolidation audit

Date: 2026-08-12

Scope: the complete `backend` and `management_suite` trees. Authentication,
tenant ownership, and `businessId` changes are explicitly excluded.

## Baseline verification

- Backend TypeScript build: passed.
- Frontend lint: passed.
- Frontend production build: passed (23 routes generated).
- Prisma schema validation: passed.
- Prisma migration status: all seven migrations applied to the configured local database.
- Existing automated tests: four payment calculation tests, all passed.

## Confirmed findings

### Financial and inventory correctness

1. Sale creation stores `amountPaid` on the sale but does not create an opening
   `Payment` event. A later payment calculates from ledger entries only and can
   replace the displayed paid total with an amount that excludes the opening
   payment.
2. Sale updates replace sale items without restoring the old stock and applying
   the new stock quantities. Editing an item or quantity can therefore leave
   inventory wrong.
3. Sale updates can change `amountPaid` directly without appending a payment
   event, so the stored total and payment history can disagree.
4. `Supplier.outstandingBalance` is editable stored data, while purchase screens
   derive the same value from purchase totals and payments. The two values can
   disagree because purchase/payment handlers do not maintain the supplier field.
5. Invoice and purchase payment rules are repeated in route handlers. This makes
   small differences and regressions more likely.
6. Money calculations use JavaScript floating-point arithmetic before Prisma
   rounds to two decimal places. Shared rounding is needed at business-rule
   boundaries.
7. Inventory movement calculations are repeated across sales, purchases, and the
   inventory route.
8. Purchase status is a free-form database string even though the API accepts
   only `DRAFT`, `ORDERED`, and `RECEIVED`.

### Routes and frontend integration

1. The normal customer API and the suite customer-insights API overlap, but have
   distinct responsibilities: one performs customer maintenance and one returns
   calculated history. They should remain separate but be named clearly.
2. The frontend payment client matches the backend endpoints but is unused.
   `/finance/payments` currently renders a generic visual workspace rather than
   the real payment ledger.
3. Several dynamic navigation destinations render generated summary/mock-style
   workspace content rather than dedicated backend-connected behavior. They must
   not be described as fully integrated features.
4. API failures in sales and expenses silently switch to editable demo data.
   This is useful during local design work but unsafe in a production build,
   where a server failure can look like successful data access.
5. API errors discard the backend's useful validation/business error message and
   expose only an HTTP status to forms.

### Duplicate and dead code

1. `components/dashboard/sales-dashboard.tsx` is not imported anywhere; the home
   page uses `business-overview.tsx`.
2. `connected-module-pages.tsx` contains old copies of catalog, customers,
   inventory, suppliers, purchases, and invoices. Only its reports export is used.
3. `operational-module-pages.tsx` still contains older purchase and invoice page
   exports. The actual routes use `luxury-document-pages.tsx`.
4. Operational suite files are oversized and compressed into very long lines,
   which makes review and maintenance harder. Splitting should be incremental to
   avoid a cosmetic rewrite of working screens.

### Schema and lifecycle observations

1. Child records such as sale/invoice/purchase items appropriately cascade when
   their parent is removed.
2. Payment links use `SetNull`, preserving financial events if a linked document,
   customer, or supplier is deleted. This avoids deleting payment history, though
   the retained reference/notes become important for traceability.
3. Inventory movements cascade when a catalog item is deleted, which removes its
   stock audit trail. Catalog items already have an `active` flag, so deactivation
   is safer than deletion after transactions exist.
4. Catalog deletion can also cascade supplier-product links and null linked sale
   items. Deletion should be rejected once transaction history exists.
5. Derived totals (`amountPaid`, balances, invoice status, supplier outstanding)
   require one authoritative update path and consistency tests.

### Dependency audit

All declared backend packages are referenced by the application or its tooling.
All declared frontend runtime packages are referenced. No dependency is removed
without a confirmed unused result.

## Planned evidence-backed changes

- Centralize rounding, payment-state, and stock transition rules in testable
  domain modules.
- Make sale opening and additional payments append-only ledger entries.
- Reconcile inventory transactionally when sale items are edited.
- Derive supplier outstanding balances from purchases rather than accepting an
  editable duplicate value.
- Connect the finance payments page to the real ledger.
- Disable silent demo substitution in production while retaining explicit local
  preview behavior.
- Remove only confirmed unused/duplicate components.
- Add domain and database-backed integration coverage for the major workflows.

## Deferred intentionally

- Authentication and multi-tenancy.
- Major visual redesigns.
- Multi-line purchase and invoice authoring (currently described in the UI as a
  future enhancement).
- Replacing the current framework or reorganizing the entire repository.
