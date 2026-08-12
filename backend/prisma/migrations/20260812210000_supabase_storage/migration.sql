CREATE TYPE "StorageVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "SaleAttachment" RENAME COLUMN "name" TO "originalName";
ALTER TABLE "SaleAttachment" RENAME COLUMN "url" TO "storageKey";
ALTER TABLE "SaleAttachment" ADD COLUMN "bucket" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "SaleAttachment" ADD COLUMN "visibility" "StorageVisibility" NOT NULL DEFAULT 'PRIVATE';

ALTER TABLE "ExpenseAttachment" RENAME COLUMN "name" TO "originalName";
ALTER TABLE "ExpenseAttachment" RENAME COLUMN "url" TO "storageKey";
ALTER TABLE "ExpenseAttachment" ADD COLUMN "bucket" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "ExpenseAttachment" ADD COLUMN "visibility" "StorageVisibility" NOT NULL DEFAULT 'PRIVATE';

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL,
  "catalogItemId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "visibility" "StorageVisibility" NOT NULL DEFAULT 'PUBLIC',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaleAttachment_saleId_bucket_storageKey_key" ON "SaleAttachment"("saleId", "bucket", "storageKey");
CREATE UNIQUE INDEX "ExpenseAttachment_expenseId_bucket_storageKey_key" ON "ExpenseAttachment"("expenseId", "bucket", "storageKey");
CREATE UNIQUE INDEX "ProductImage_bucket_storageKey_key" ON "ProductImage"("bucket", "storageKey");
CREATE INDEX "ProductImage_catalogItemId_isPrimary_idx" ON "ProductImage"("catalogItemId", "isPrimary");

ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
