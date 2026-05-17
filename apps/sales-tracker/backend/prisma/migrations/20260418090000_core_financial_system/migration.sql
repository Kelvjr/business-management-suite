-- CreateTable
CREATE TABLE IF NOT EXISTS "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InternalUser" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "isAdmin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalUser_pkey" PRIMARY KEY ("id")
);

-- Seed default internal business context for the MVP before auth/tenancy.
INSERT INTO "Business" ("id", "name", "ownerEmail", "createdAt", "updatedAt")
VALUES ('default-business', 'Default Business', 'owner@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "InternalUser" ("id", "businessId", "name", "email", "role", "isAdmin", "createdAt", "updatedAt")
VALUES ('default-owner', 'default-business', 'Default Owner', 'owner@example.com', 'owner', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "businessId" TEXT NOT NULL DEFAULT 'default-business';
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "businessId" TEXT NOT NULL DEFAULT 'default-business';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "businessId" TEXT NOT NULL DEFAULT 'default-business';

-- Drop old global uniqueness before adding tenant-scoped uniqueness.
DROP INDEX IF EXISTS "Category_name_key";
DROP INDEX IF EXISTS "Customer_email_key";

-- CreateTable
CREATE TABLE IF NOT EXISTS "SaleLineItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL DEFAULT 'default-business',
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendor" TEXT,
    "notes" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL DEFAULT 'default-business',
    "invoiceNumber" TEXT NOT NULL,
    "saleId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "lineItems" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL DEFAULT 'default-business',
    "saleId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethod" TEXT,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProfitSnapshot" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL DEFAULT 'default-business',
    "date" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL,
    "expenses" DECIMAL(10,2) NOT NULL,
    "profit" DECIMAL(10,2) NOT NULL,
    "margin" DECIMAL(7,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfitSnapshot_pkey" PRIMARY KEY ("id")
);

-- Backfill existing sales with one line item each.
INSERT INTO "SaleLineItem" (
    "id",
    "saleId",
    "itemType",
    "itemName",
    "category",
    "subcategory",
    "quantity",
    "unitPrice",
    "totalAmount",
    "createdAt",
    "updatedAt"
)
SELECT
    'line-' || "id",
    "id",
    "itemType",
    "itemName",
    "category",
    "subcategory",
    "quantity",
    "unitPrice",
    "totalAmount",
    "createdAt",
    "updatedAt"
FROM "Sale"
WHERE NOT EXISTS (
    SELECT 1 FROM "SaleLineItem" WHERE "SaleLineItem"."saleId" = "Sale"."id"
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "InternalUser_email_key" ON "InternalUser"("email");
CREATE INDEX IF NOT EXISTS "InternalUser_businessId_idx" ON "InternalUser"("businessId");
CREATE INDEX IF NOT EXISTS "Sale_businessId_soldAt_idx" ON "Sale"("businessId", "soldAt");
CREATE INDEX IF NOT EXISTS "Sale_customerId_idx" ON "Sale"("customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_businessId_name_key" ON "Category"("businessId", "name");
CREATE INDEX IF NOT EXISTS "Category_businessId_idx" ON "Category"("businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_email_key" ON "Customer"("businessId", "email");
CREATE INDEX IF NOT EXISTS "Customer_businessId_idx" ON "Customer"("businessId");
CREATE INDEX IF NOT EXISTS "SaleLineItem_saleId_idx" ON "SaleLineItem"("saleId");
CREATE INDEX IF NOT EXISTS "Expense_businessId_date_idx" ON "Expense"("businessId", "date");
CREATE INDEX IF NOT EXISTS "Expense_businessId_category_idx" ON "Expense"("businessId", "category");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Invoice_businessId_createdAt_idx" ON "Invoice"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "Invoice_saleId_idx" ON "Invoice"("saleId");
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");
CREATE INDEX IF NOT EXISTS "Receipt_businessId_generatedAt_idx" ON "Receipt"("businessId", "generatedAt");
CREATE INDEX IF NOT EXISTS "Receipt_saleId_idx" ON "Receipt"("saleId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProfitSnapshot_businessId_date_key" ON "ProfitSnapshot"("businessId", "date");
CREATE INDEX IF NOT EXISTS "ProfitSnapshot_businessId_date_idx" ON "ProfitSnapshot"("businessId", "date");

-- AddForeignKey
ALTER TABLE "InternalUser" ADD CONSTRAINT "InternalUser_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProfitSnapshot" ADD CONSTRAINT "ProfitSnapshot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
