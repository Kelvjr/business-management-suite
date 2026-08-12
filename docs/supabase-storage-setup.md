# Supabase Storage setup

The application now keeps uploaded files in Supabase Storage. PostgreSQL stores
only the bucket name, file key, original filename, type, size, visibility, and
which record owns the file. It never stores a temporary signed link.

## 1. Choose a Supabase project

You may use the Supabase project that already hosts your database, or a separate
Supabase project used only for files. No database move is required. This change
uses the Storage service only.

## 2. Create two buckets

In Supabase, open **Storage** and create these buckets:

- `renaissance-public` — make this bucket public. It contains product images.
  Set the file-size limit to 5 MB and allow `image/jpeg`, `image/png`, and
  `image/webp`.
- `renaissance-private` — leave this bucket private. It contains sale and
  expense attachments. Set the file-size limit to 10 MB and allow `image/jpeg`,
  `image/png`, `image/webp`, and `application/pdf`.

You can use different bucket names, but they must match the environment values.
The application generates every file path; users cannot choose storage paths.

## 3. Add backend environment values

Copy these values into `backend/.env`:

```dotenv
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-backend-only-service-role-key"
SUPABASE_PUBLIC_BUCKET="renaissance-public"
SUPABASE_PRIVATE_BUCKET="renaissance-private"
STORAGE_SIGNED_URL_TTL_SECONDS=300
```

Find the project URL and service-role key in the Supabase project settings. The
service-role key is a secret. Keep it in the backend only; never add it to
`management_suite/.env.local`, browser code, a screenshot, or source control.

The public bucket is intentionally readable because it holds catalog pictures.
The private bucket stays private. The backend creates a five-minute link only
when someone opens a sale or expense file.

## 4. Apply the database update

From `backend`, run:

```powershell
npm run prisma:deploy
npm run prisma:generate
```

The update preserves the sample receipt rows as placeholders. They are not real
files and are not copied to Supabase. The old `backend/uploads` directory had no
real files, so there was nothing else to move.

## 5. Check the setup

Run the normal checks:

```powershell
npm test
npm run build
```

When the Supabase values and buckets are present, the storage test also uploads
a small test image and removes it again. Without those values, that one live
check is skipped while all local storage checks still run.

Then start both applications and try these flows:

1. Add a product with an image, add another image, replace the primary image,
   and remove an image.
2. Record a sale with a receipt and open it from the sale details page.
3. Record an expense with a receipt and open it from the expense page.
4. Try a renamed text file with a `.png` name and a file above the stated size.
   Both should be rejected.

## Operating notes

- A sale or expense is saved before its files are uploaded, so files always have
  a real owner. If a file upload fails, the saved record remains and the screen
  explains that the attachment failed.
- If the database cannot save file information after an upload, the newly
  uploaded object is removed.
- Removing an attachment removes the object before its database row. Replacing
  a product image saves the new image first and removes the old image only after
  the replacement is active.
- Deleting a product is blocked until its images are removed. Deleting a sale or
  expense removes its stored attachments after the business record is deleted.
- The code talks through a small storage layer, so another object-storage
  provider can be added later without rewriting the sale, expense, or catalog
  screens.
