# Storage audit

Date: 2026-08-12

## Existing implementation

- `POST /api/uploads` uses Multer disk storage and writes directly to
  `backend/uploads` with a UUID plus the user filename extension.
- Express serves the whole directory publicly at `/uploads`.
- The route accepts one file, limits it to 15 MB, and checks only the browser
  supplied MIME type for JPEG, PNG, WebP, or PDF.
- Sale and expense forms upload immediately, before their business record exists,
  then send returned metadata (`name`, `mimeType`, `size`, `url`) during record
  creation.
- `SaleAttachment` and `ExpenseAttachment` store a permanent local URL but no
  bucket, storage key, privacy setting, or provider-neutral identifier.
- Sale details construct a local backend URL directly. Expense receipt cards use
  the stored URL directly.
- Removing a selected file before saving removes it only from browser state; the
  disk object remains orphaned.
- Deleting a sale or expense cascades its database metadata but does not delete
  the disk object.
- Catalog items have one free-text `imageUrl`; there is no managed product-image
  upload, metadata, replacement, ordering, or deletion behavior.
- No purchase, supplier, or invoice document upload feature currently exists.

## Existing files and data

- `backend/uploads` contains only the one-byte `.gitkeep`; there are no meaningful
  local files to migrate.
- The configured database contains zero sale attachments and zero product image
  URLs.
- It contains 13 seeded expense attachment rows. Every one uses
  `#mock-receipt`; these are demo placeholders and do not correspond to files.
  They should remain recognizable as demo metadata and must not be uploaded as if
  they were real receipts.

## Required changes

- Replace disk writes and public static serving with a provider-neutral storage
  service and a Supabase provider used only by the backend.
- Validate file signatures, size, and permitted type on the backend.
- Upload only after a real sale, expense, or product exists so storage paths use
  real resource IDs and abandoned forms do not create objects.
- Store permanent bucket/key metadata in PostgreSQL; generate signed URLs only
  when private files are opened.
- Keep product images public and financial attachments private.
- Add resource-specific upload, open, replacement, and deletion routes that never
  accept a client-selected storage path.
- Delete storage objects when attachment metadata is intentionally deleted and
  compensate for database failures after uploads.
- Preserve purchase/invoice/supplier behavior without inventing document features
  that are not currently present.
