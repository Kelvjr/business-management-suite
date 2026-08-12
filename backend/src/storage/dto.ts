type AttachmentRow = { id: string; originalName: string; mimeType: string; size: number; storageKey: string };
type ProductImageRow = AttachmentRow & { isPrimary: boolean };

export function attachmentDto(resource: "sales" | "expenses", parentId: string, row: AttachmentRow) {
  return {
    id: row.id,
    name: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    url: row.storageKey.startsWith("#mock-") ? row.storageKey : `/api/storage/${resource}/${parentId}/attachments/${row.id}/open`,
  };
}

export function productImageDto(productId: string, row: ProductImageRow) {
  return {
    id: row.id,
    name: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    isPrimary: row.isPrimary,
    url: `/api/storage/products/${productId}/images/${row.id}/open`,
  };
}
