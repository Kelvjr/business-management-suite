-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('PRODUCT', 'SERVICE', 'PACKAGE', 'CUSTOM');
CREATE TYPE "PricingMethod" AS ENUM ('FIXED', 'PER_ITEM', 'BY_WEIGHT', 'BY_VOLUME', 'PER_HOUR', 'PER_DAY', 'PER_PERSON', 'CUSTOM_UNIT');
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PARTIALLY_PAID', 'UNPAID');

-- Extend Sale
ALTER TABLE "Sale"
  ADD COLUMN "type" "SaleType" NOT NULL DEFAULT 'CUSTOM',
  ADD COLUMN "pricingMethod" "PricingMethod" NOT NULL DEFAULT 'FIXED',
  ADD COLUMN "measurement" DECIMAL(12,3),
  ADD COLUMN "unit" TEXT,
  ADD COLUMN "rate" DECIMAL(12,2),
  ADD COLUMN "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "manualTotalOverride" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID',
  ADD COLUMN "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "balanceDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "customerId" TEXT;

UPDATE "Sale" SET "subtotal" = "amount", "amountPaid" = "amount", "rate" = "amount";

-- Create Customer
CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Create SaleItem
CREATE TABLE "SaleItem" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "SaleType" NOT NULL,
  "pricingMethod" "PricingMethod" NOT NULL,
  "measurement" DECIMAL(12,3),
  "unit" TEXT,
  "rate" DECIMAL(12,2) NOT NULL,
  "lineTotal" DECIMAL(12,2) NOT NULL,
  "manualTotalOverride" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- Backfill one structured item for each legacy sale
INSERT INTO "SaleItem" ("id", "saleId", "name", "type", "pricingMethod", "rate", "lineTotal", "sortOrder")
SELECT CONCAT('legacy-item-', "id"), "id", "description", 'CUSTOM', 'FIXED', "amount", "amount", 0 FROM "Sale";

-- Create SaleAttachment
CREATE TABLE "SaleAttachment" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaleAttachment_pkey" PRIMARY KEY ("id")
);

-- Create SaleActivity
CREATE TABLE "SaleActivity" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "changes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaleActivity_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SaleActivity" ("id", "saleId", "action", "summary")
SELECT CONCAT('legacy-created-', "id"), "id", 'CREATED', 'Sale recorded' FROM "Sale";

ALTER TABLE "BusinessSettings" ADD COLUMN "salesCustomFields" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX "Customer_name_idx" ON "Customer"("name");
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleAttachment_saleId_idx" ON "SaleAttachment"("saleId");
CREATE INDEX "SaleActivity_saleId_createdAt_idx" ON "SaleActivity"("saleId", "createdAt");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleAttachment" ADD CONSTRAINT "SaleAttachment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleActivity" ADD CONSTRAINT "SaleActivity_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
