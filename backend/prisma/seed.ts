import "dotenv/config";
import { PaymentMethod, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const customers = ["Northstar Studio", "Walk-in customer", "Marble & Co.", "Atlas Coffee", "Lumen Works", "Cedar House"];
const products = [
  ["Brand strategy session", "Services", 1250],
  ["Website care plan", "Subscriptions", 480],
  ["Retail order", "Products", 765],
  ["Team workshop", "Services", 2100],
  ["Digital template pack", "Digital", 149],
  ["Consulting retainer", "Subscriptions", 1800],
] as const;

async function main() {
  await prisma.sale.deleteMany();
  for (let index = 0; index < 24; index += 1) {
    const product = products[index % products.length];
    const soldAt = new Date();
    soldAt.setDate(soldAt.getDate() - (index % 18));
    soldAt.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);
    await prisma.sale.create({
      data: {
        reference: `SAL-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`,
        customerName: customers[index % customers.length],
        description: product[0], category: product[1], amount: product[2] + (index % 4) * 35,
        paymentMethod: [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH, PaymentMethod.MOBILE_MONEY][index % 4],
        soldAt,
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
