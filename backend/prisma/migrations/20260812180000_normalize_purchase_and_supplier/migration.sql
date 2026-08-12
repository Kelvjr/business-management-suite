CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED');

ALTER TABLE "Purchase"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PurchaseStatus" USING ("status"::"PurchaseStatus"),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "Supplier" DROP COLUMN "outstandingBalance";

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_received_quantity_valid" CHECK ("receivedQty" >= 0 AND "receivedQty" <= "quantity");
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_stock_nonnegative" CHECK ("quantity" >= 0 AND "reorderLevel" >= 0);
