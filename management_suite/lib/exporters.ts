import { paymentLabels, type Sale } from "@/lib/sales";
import type { Expense } from "@/lib/expenses";

const money = (currencyCode: string) => new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode, maximumFractionDigits: 2 });

const download = (content: BlobPart, type: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function exportCsv(sales: Sale[], currencyCode = "USD") {
  const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = sales.map((sale) => [sale.reference, new Date(sale.soldAt).toLocaleString(), sale.customerName, sale.description, sale.category, paymentLabels[sale.paymentMethod], sale.amount].map(cell).join(","));
  download([`Reference,Date,Customer,Description,Category,Payment method,Amount (${currencyCode})`, ...rows].join("\n"), "text/csv;charset=utf-8", "sales-report.csv");
}

export async function exportPdf(sales: Sale[], currencyCode = "USD") {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: "landscape" });
  const total = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const formatter = money(currencyCode);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.text("Sales report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${sales.length} sales  |  ${formatter.format(total)} total revenue`, 14, 25);
  autoTable(doc, {
    startY: 32,
    head: [["Reference", "Date", "Customer", "Description", "Category", "Payment", "Amount"]],
    body: sales.map((sale) => [sale.reference, new Date(sale.soldAt).toLocaleDateString(), sale.customerName ?? "Walk-in", sale.description, sale.category, paymentLabels[sale.paymentMethod], formatter.format(sale.amount)]),
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 3 },
  });
  doc.save("sales-report.pdf");
}

export function exportExpensesCsv(expenses: Expense[], currencyCode: string) {
  const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = expenses.map((expense) => [expense.reference, new Date(expense.incurredAt).toLocaleString(), expense.vendor, expense.description, expense.category, paymentLabels[expense.paymentMethod], expense.paymentStatus, expense.amount].map(cell).join(","));
  download([`Reference,Date,Vendor,Description,Category,Payment method,Status,Amount (${currencyCode})`, ...rows].join("\n"), "text/csv;charset=utf-8", "expenses-report.csv");
}

export async function exportExpensesPdf(expenses: Expense[], currencyCode: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape" }); const formatter = money(currencyCode); const total = expenses.reduce((sum, row) => sum + row.amount, 0);
  doc.setFontSize(20); doc.text("Expenses report", 14, 18); doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`${expenses.length} expenses  |  ${formatter.format(total)} total spending`, 14, 25);
  autoTable(doc, { startY: 32, head: [["Reference", "Date", "Vendor", "Description", "Category", "Payment", "Amount"]], body: expenses.map((row) => [row.reference, new Date(row.incurredAt).toLocaleDateString(), row.vendor ?? "—", row.description, row.category, paymentLabels[row.paymentMethod], formatter.format(row.amount)]), theme: "striped", headStyles: { fillColor: [19, 35, 58] }, styles: { fontSize: 8, cellPadding: 3 } });
  doc.save("expenses-report.pdf");
}

export type ReceiptDraft = {
  reference: string;
  customerName?: string | null;
  soldAt: string;
  items: Array<{ name: string; measurement?: number | null; unit?: string | null; lineTotal: number }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: string;
};

export async function downloadReceipt(receipt: ReceiptDraft, businessName: string, currencyCode: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF();
  const number = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amount = (value: number) => `${currencyCode} ${number.format(value)}`;
  doc.setTextColor(19, 35, 58); doc.setFontSize(19); doc.text(businessName, 14, 18);
  doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Receipt ${receipt.reference}`, 14, 25); doc.text(new Date(receipt.soldAt).toLocaleString(), 14, 31);
  if (receipt.customerName) doc.text(`Customer: ${receipt.customerName}`, 14, 37);
  autoTable(doc, { startY: receipt.customerName ? 44 : 38, head: [["Item / service", "Measurement", "Total"]], body: receipt.items.map((item) => [item.name, item.measurement ? `${item.measurement} ${item.unit ?? ""}` : "Fixed", amount(item.lineTotal)]), theme: "striped", headStyles: { fillColor: [19, 35, 58] } });
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const rows = [["Subtotal", receipt.subtotal], ["Discount", -receipt.discountAmount], ["Tax", receipt.taxAmount], ["Total", receipt.total], ["Paid", receipt.amountPaid], ["Balance due", receipt.balanceDue]] as const;
  rows.forEach(([label, value], index) => { doc.setTextColor(index === 3 ? 19 : 100, index === 3 ? 35 : 116, index === 3 ? 58 : 139); doc.setFontSize(index === 3 ? 12 : 10); doc.text(label, 130, finalY + index * 7); doc.text(amount(value), 196, finalY + index * 7, { align: "right" }); });
  doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.text(`Payment: ${receipt.paymentMethod}`, 14, finalY); doc.text("Thank you for your business.", 14, finalY + 9);
  doc.save(`receipt-${receipt.reference}.pdf`);
}
