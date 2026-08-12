# Storage integration report

## Before

The backend wrote sale and expense files into `backend/uploads` and served that
folder to anyone who knew a file address. The browser supplied the filename and
file type. Product pictures were only a typed web-address field. Removing a
record did not reliably remove its file.

The folder contained only `.gitkeep`; it contained no uploaded business files.
The database contained no sale files or product pictures. Its 13 expense-file
rows were demo placeholders named `#mock-receipt`, not real files.

## Now

- One provider-neutral storage service handles upload, deletion, public links,
  short-lived private links, generated paths, and file checks.
- Supabase is contained behind one provider. Business routes do not call the
  Supabase client directly.
- Product pictures use the public bucket. A product can have a primary picture
  and up to seven additional pictures, with preview, replacement, and removal.
- Sale and expense files use the private bucket. The application creates a
  five-minute link when a user opens one.
- Paths are grouped as `products/{productId}`, `sales/{saleId}`, and
  `expenses/{expenseId}`. The service already knows the reserved purchase and
  invoice resource names, but no new upload feature was invented for modules
  that did not have one.
- Stored filenames are random UUIDs. Original names are retained only as
  metadata.
- The backend reads file bytes to identify JPEG, PNG, WebP, and PDF files.
  Product pictures are limited to 5 MB. Sale and expense files are limited to
  10 MB.
- A database failure after upload triggers cleanup of the new object. Replacing
  a product picture uploads and activates the new picture before deleting the
  old one. Explicit file deletion removes the storage object and its database
  record.
- No authentication, multi-tenancy, fake business identifiers, or database move
  was added.

## Database

Migration `20260812210000_supabase_storage` adds `ProductImage`, adds public or
private visibility, and changes sale/expense file rows from a saved URL to a
bucket plus permanent storage key. Old applied migrations were not edited.

## Checks completed

- Database migration: applied successfully; all 9 migrations are current.
- Backend unit tests: 24 passed, 2 skipped. The skips are the separately run
  database flow and the live Supabase check.
- Full database flow: 1 passed. It covered products, image replacement, sale and
  expense file ownership, private links, missing files, deletion, sales,
  expenses, inventory, purchases, invoices, payments, and customers.
- Backend TypeScript build: passed.
- Frontend lint: passed.
- Frontend production build: passed, including all 23 generated pages.
- Browser check: catalog data and product image controls loaded; sale and expense
  attachment controls loaded with the correct stated limits.
- Live Supabase upload: skipped because `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` are not configured on this machine.

## Manual work remaining

Create the two Supabase buckets and add the backend-only environment values in
`docs/supabase-storage-setup.md`. Then rerun the test suite and perform one real
upload from each screen. No local files need migration. The 13 demo receipt
placeholders intentionally remain placeholders.

The storage boundary is ready for future authentication and business ownership:
those checks and a real business path segment can be added in one central area.
They are intentionally not implemented now.
