import "dotenv/config";
import { CatalogKind, PaymentStatus, PrismaClient, StockMovementType } from "@prisma/client";

const prisma = new PrismaClient();
const catalog = [
  [CatalogKind.PRODUCT,"Classic Hair Pomade","PRD-001","Hair care",32,65,18,6,"89010001",null,null],
  [CatalogKind.PRODUCT,"Hydrating Shampoo","PRD-002","Hair care",28,55,5,8,"89010002",null,null],
  [CatalogKind.PRODUCT,"Beard Oil","PRD-003","Grooming",24,50,11,5,"89010003",null,null],
  [CatalogKind.PRODUCT,"Premium Hair Extensions","PRD-004","Hair",180,320,3,4,"89010004",null,null],
  [CatalogKind.PRODUCT,"Nail Care Kit","PRD-005","Nails",45,90,14,5,"89010005",null,null],
  [CatalogKind.SERVICE,"Classic Haircut","SRV-001","Hair",0,80,0,0,null,45,"Kwame"],
  [CatalogKind.SERVICE,"Braids Installation","SRV-002","Hair",0,350,0,0,null,180,"Ama"],
  [CatalogKind.SERVICE,"Manicure & Polish","SRV-003","Nails",0,120,0,0,null,60,"Efua"],
  [CatalogKind.SERVICE,"Bridal Makeup","SRV-004","Beauty",0,600,0,0,null,120,"Nana"],
] as const;

async function main() {
  const items = new Map<string,string>();
  for (const [kind,name,sku,category,costPrice,sellingPrice,quantity,reorderLevel,barcode,durationMinutes,assignedStaff] of catalog) {
    const item = await prisma.catalogItem.upsert({ where: { sku }, update: {}, create: { kind,name,sku,category,costPrice,sellingPrice,quantity,reorderLevel,barcode,durationMinutes,assignedStaff } }); items.set(sku,item.id);
    if (kind === CatalogKind.PRODUCT && !(await prisma.inventoryMovement.findFirst({ where: { catalogItemId: item.id } }))) await prisma.inventoryMovement.create({ data: { catalogItemId: item.id, type: StockMovementType.STOCK_IN, quantity, beforeQty: 0, afterQty: quantity, reference: "OPENING-STOCK", notes: "Mock opening inventory" } });
  }
  const customerRows = [
    ["Adwoa Mensah","024 555 0182","adwoa@example.com","East Legon, Accra"], ["Kojo Asante","055 620 4107","kojo@example.com","Osu, Accra"], ["Akosua Owusu","020 144 8871","akosua@example.com","Kumasi"], ["Yaw Boateng","027 903 1145","yaw@example.com","Tema"], ["Esi Addo","054 771 2380","esi@example.com","Dansoman, Accra"],
  ] as const;
  const seededCustomers = [];
  for (const [name,phone,email,address] of customerRows) { const existing = await prisma.customer.findFirst({ where: { email } }); const customer = existing ?? await prisma.customer.create({ data: { name,phone,email,address,notes:"Mock customer profile" } }); seededCustomers.push(customer); await prisma.sale.updateMany({ where: { customerName: name, customerId: null }, data: { customerId: customer.id } }); }
  const unlinkedSales = await prisma.sale.findMany({ where: { customerId: null }, orderBy: { soldAt: "desc" }, take: 15 });
  for (const [index, sale] of unlinkedSales.entries()) { const customer = seededCustomers[index % seededCustomers.length]; await prisma.sale.update({ where: { id: sale.id }, data: { customerId: customer.id, customerName: customer.name } }); }
  const supplierOne = await prisma.supplier.upsert({ where: { id: "supplier-beauty-depot" }, update: {}, create: { id:"supplier-beauty-depot",name:"Accra Beauty Depot",contactName:"Mavis Quaye",phone:"030 255 4401",email:"orders@beautydepot.example",paymentTerms:"30 days" } });
  const supplierTwo = await prisma.supplier.upsert({ where: { id: "supplier-pro-hair" }, update: {}, create: { id:"supplier-pro-hair",name:"Pro Hair Ghana",contactName:"Daniel Ofori",phone:"024 811 0922",email:"sales@prohair.example",paymentTerms:"50% deposit" } });
  for (const sku of ["PRD-001","PRD-002","PRD-003","PRD-005"]) await prisma.supplierProduct.upsert({ where:{ supplierId_catalogItemId:{supplierId:supplierOne.id,catalogItemId:items.get(sku)!}},update:{},create:{supplierId:supplierOne.id,catalogItemId:items.get(sku)!} });
  await prisma.supplierProduct.upsert({ where:{supplierId_catalogItemId:{supplierId:supplierTwo.id,catalogItemId:items.get("PRD-004")!}},update:{},create:{supplierId:supplierTwo.id,catalogItemId:items.get("PRD-004")!} });
  if (!(await prisma.purchase.findUnique({ where:{reference:"PO-2026-001"} }))) await prisma.purchase.create({ data:{ reference:"PO-2026-001",supplierId:supplierOne.id,status:"RECEIVED",total:2240,amountPaid:2240,orderedAt:new Date(Date.now()-12*86400000),receivedAt:new Date(Date.now()-8*86400000),items:{create:[{catalogItemId:items.get("PRD-001")!,quantity:30,receivedQty:30,unitCost:32},{catalogItemId:items.get("PRD-002")!,quantity:20,receivedQty:20,unitCost:28},{catalogItemId:items.get("PRD-003")!,quantity:30,receivedQty:30,unitCost:24}]}} });
  if (!(await prisma.purchase.findUnique({ where:{reference:"PO-2026-002"} }))) await prisma.purchase.create({ data:{ reference:"PO-2026-002",supplierId:supplierTwo.id,status:"ORDERED",total:1800,amountPaid:900,orderedAt:new Date(Date.now()-3*86400000),dueAt:new Date(Date.now()+5*86400000),items:{create:[{catalogItemId:items.get("PRD-004")!,quantity:10,receivedQty:0,unitCost:180}]}} });
  if (!(await prisma.invoice.findUnique({ where:{reference:"INV-2026-001"} }))) await prisma.invoice.create({ data:{ reference:"INV-2026-001",customerName:"Adwoa Mensah",status:PaymentStatus.PARTIALLY_PAID,subtotal:1200,taxAmount:0,total:1200,amountPaid:600,dueAt:new Date(Date.now()+7*86400000),items:{create:[{description:"Bridal makeup package",quantity:2,rate:600,total:1200}]}} });
  if (!(await prisma.invoice.findUnique({ where:{reference:"INV-2026-002"} }))) await prisma.invoice.create({ data:{ reference:"INV-2026-002",customerName:"Kojo Asante",status:PaymentStatus.UNPAID,subtotal:450,taxAmount:0,total:450,amountPaid:0,dueAt:new Date(Date.now()+14*86400000),items:{create:[{description:"Grooming package",quantity:1,rate:450,total:450}]}} });
}
main().finally(()=>prisma.$disconnect());
