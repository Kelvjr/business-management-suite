import { Router, type Request } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { getStorage } from "../storage/index.js";
import { attachmentDto, productImageDto } from "../storage/dto.js";
import { persistUploadedObject } from "../storage/persistence.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
export const storageRouter = Router();

function fileFrom(requestFile: Express.Multer.File | undefined) {
  if (!requestFile) throw new Error("Choose a file to upload");
  return { originalName: requestFile.originalname, claimedMimeType: requestFile.mimetype, size: requestFile.size, buffer: requestFile.buffer };
}

function param(req: Request, name: string) {
  const value = req.params[name];
  if (typeof value !== "string") throw new Error("Invalid route parameter");
  return value;
}

function recordFrom(stored: { bucket: string; storageKey: string; originalName: string; mimeType: string; size: number; visibility: "PUBLIC" | "PRIVATE" }) {
  return { bucket: stored.bucket, storageKey: stored.storageKey, originalName: stored.originalName, mimeType: stored.mimeType, size: stored.size, visibility: stored.visibility };
}

async function removeStored(rows: Array<{ bucket: string; storageKey: string }>) {
  for (const row of rows) {
    if (row.bucket === "legacy" || row.storageKey.startsWith("#mock-")) continue;
    await getStorage().delete(row);
  }
}

storageRouter.post("/sales/:id/attachments", upload.single("file"), async (req, res, next) => {
  try {
    const saleId = param(req, "id");
    await prisma.sale.findUniqueOrThrow({ where: { id: saleId }, select: { id: true } });
    const stored = await getStorage().upload({ resource: "sales", resourceId: saleId, file: fileFrom(req.file), policy: "ATTACHMENT", visibility: "PRIVATE" });
    const row = await persistUploadedObject(stored, (object) => getStorage().delete(object), (object) => prisma.saleAttachment.create({ data: { saleId, ...recordFrom(object) } }));
    res.status(201).json({ data: attachmentDto("sales", saleId, row) });
  } catch (error) { next(error); }
});

storageRouter.post("/expenses/:id/attachments", upload.single("file"), async (req, res, next) => {
  try {
    const expenseId = param(req, "id");
    await prisma.expense.findUniqueOrThrow({ where: { id: expenseId }, select: { id: true } });
    const stored = await getStorage().upload({ resource: "expenses", resourceId: expenseId, file: fileFrom(req.file), policy: "ATTACHMENT", visibility: "PRIVATE" });
    const row = await persistUploadedObject(stored, (object) => getStorage().delete(object), (object) => prisma.expenseAttachment.create({ data: { expenseId, ...recordFrom(object) } }));
    res.status(201).json({ data: attachmentDto("expenses", expenseId, row) });
  } catch (error) { next(error); }
});

for (const resource of ["sales", "expenses"] as const) {
  storageRouter.get(`/${resource}/:id/attachments/:attachmentId/open`, async (req, res, next) => {
    try {
      const id = param(req, "id"); const attachmentId = param(req, "attachmentId");
      const row = resource === "sales"
        ? await prisma.saleAttachment.findFirstOrThrow({ where: { id: attachmentId, saleId: id } })
        : await prisma.expenseAttachment.findFirstOrThrow({ where: { id: attachmentId, expenseId: id } });
      if (row.bucket === "legacy" || row.storageKey.startsWith("#mock-")) return res.status(404).json({ error: "This sample receipt is not a real uploaded file" });
      res.redirect(await getStorage().readUrl(row));
    } catch (error) { next(error); }
  });

  storageRouter.delete(`/${resource}/:id/attachments/:attachmentId`, async (req, res, next) => {
    try {
      const id = param(req, "id"); const attachmentId = param(req, "attachmentId");
      const row = resource === "sales"
        ? await prisma.saleAttachment.findFirstOrThrow({ where: { id: attachmentId, saleId: id } })
        : await prisma.expenseAttachment.findFirstOrThrow({ where: { id: attachmentId, expenseId: id } });
      await removeStored([row]);
      if (resource === "sales") await prisma.saleAttachment.delete({ where: { id: row.id } });
      else await prisma.expenseAttachment.delete({ where: { id: row.id } });
      res.status(204).send();
    } catch (error) { next(error); }
  });
}

storageRouter.post("/products/:id/images", upload.single("file"), async (req, res, next) => {
  try {
    const productId = param(req, "id");
    const product = await prisma.catalogItem.findUniqueOrThrow({ where: { id: productId }, include: { images: { orderBy: { createdAt: "asc" } } } });
    if (product.kind !== "PRODUCT") return res.status(400).json({ error: "Images can only be added to products" });
    const replacePrimary = req.body.replacePrimary === "true";
    if (product.images.length >= 8 && !replacePrimary) return res.status(409).json({ error: "A product can have up to 8 images" });
    const shouldBePrimary = replacePrimary || !product.images.some((row) => row.isPrimary) || req.body.isPrimary === "true";
    const stored = await getStorage().upload({ resource: "products", resourceId: productId, file: fileFrom(req.file), policy: "PRODUCT_IMAGE", visibility: "PUBLIC" });
    try {
      const result = await prisma.$transaction(async (tx) => {
        const replaced = replacePrimary ? await tx.productImage.findMany({ where: { catalogItemId: product.id, isPrimary: true } }) : [];
        if (shouldBePrimary) await tx.productImage.updateMany({ where: { catalogItemId: product.id }, data: { isPrimary: false } });
        if (replaced.length) await tx.productImage.deleteMany({ where: { id: { in: replaced.map((row) => row.id) } } });
        const row = await tx.productImage.create({ data: { catalogItemId: product.id, bucket: stored.bucket, storageKey: stored.storageKey, originalName: stored.originalName, mimeType: stored.mimeType, size: stored.size, visibility: "PUBLIC", isPrimary: shouldBePrimary } });
        return { row, replaced };
      });
      await removeStored(result.replaced).catch((error) => console.error("Old product image cleanup failed", error));
      res.status(201).json({ data: productImageDto(product.id, result.row) });
    } catch (error) {
      await getStorage().delete(stored).catch(() => undefined);
      throw error;
    }
  } catch (error) { next(error); }
});

storageRouter.get("/products/:id/images/:imageId/open", async (req, res, next) => {
  try {
    const row = await prisma.productImage.findFirstOrThrow({ where: { id: param(req, "imageId"), catalogItemId: param(req, "id") } });
    res.redirect(await getStorage().readUrl(row));
  } catch (error) { next(error); }
});

storageRouter.delete("/products/:id/images/:imageId", async (req, res, next) => {
  try {
    const productId = param(req, "id");
    const row = await prisma.productImage.findFirstOrThrow({ where: { id: param(req, "imageId"), catalogItemId: productId } });
    await getStorage().delete(row);
    await prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: row.id } });
      if (row.isPrimary) {
        const nextImage = await tx.productImage.findFirst({ where: { catalogItemId: productId }, orderBy: { createdAt: "asc" } });
        if (nextImage) await tx.productImage.update({ where: { id: nextImage.id }, data: { isPrimary: true } });
      }
    });
    res.status(204).send();
  } catch (error) { next(error); }
});
