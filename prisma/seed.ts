/**
 * Seed: delivery areas + raw-material inventory with per-tiffin recipe.
 *   npm run db:seed            → base data only (safe to run again)
 *   npm run db:seed -- --demo  → also adds sample factories, orders, subscribers & expenses to try the admin
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { addDays, endAfterWorkingDays, todayDb, weekday } from "../lib/dates";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Edit these to your real industrial areas (or do it later from /admin/routes)
const AREAS = [
  { slug: "industrial-area-phase-1", nameEn: "Industrial Area Phase 1", nameHi: "औद्योगिक क्षेत्र फेज़ 1", routeSeq: 1 },
  { slug: "industrial-area-phase-2", nameEn: "Industrial Area Phase 2", nameHi: "औद्योगिक क्षेत्र फेज़ 2", routeSeq: 2 },
  { slug: "transport-nagar", nameEn: "Transport Nagar", nameHi: "ट्रांसपोर्ट नगर", routeSeq: 3 },
];

// Approximate 2026 rates — update from /admin/inventory when you buy.
// per*Tiffin = quantity one tiffin uses (4 roti ≈ 120 g atta).
const ITEMS = [
  { key: "atta", nameEn: "Atta (wheat flour)", nameHi: "आटा", unit: "kg", stock: 50, lowStockLevel: 15, costPerUnit: 38, perVegTiffin: 0.12, perPaneerTiffin: 0.12 },
  { key: "rice", nameEn: "Rice", nameHi: "चावल", unit: "kg", stock: 30, lowStockLevel: 10, costPerUnit: 45, perVegTiffin: 0.075, perPaneerTiffin: 0.075 },
  { key: "dal", nameEn: "Dal (arhar/moong)", nameHi: "दाल", unit: "kg", stock: 15, lowStockLevel: 5, costPerUnit: 140, perVegTiffin: 0.04, perPaneerTiffin: 0.04 },
  { key: "sabji", nameEn: "Sabji (vegetables)", nameHi: "सब्ज़ी", unit: "kg", stock: 25, lowStockLevel: 10, costPerUnit: 35, perVegTiffin: 0.15, perPaneerTiffin: 0.05 },
  { key: "paneer", nameEn: "Paneer", nameHi: "पनीर", unit: "kg", stock: 0, lowStockLevel: 0, costPerUnit: 360, perVegTiffin: 0, perPaneerTiffin: 0.06 },
  { key: "oil", nameEn: "Cooking oil", nameHi: "तेल", unit: "L", stock: 15, lowStockLevel: 5, costPerUnit: 150, perVegTiffin: 0.015, perPaneerTiffin: 0.018 },
  { key: "salad", nameEn: "Salad (onion, cucumber)", nameHi: "सलाद", unit: "kg", stock: 10, lowStockLevel: 4, costPerUnit: 30, perVegTiffin: 0.05, perPaneerTiffin: 0.05 },
  { key: "masala", nameEn: "Masala & salt", nameHi: "मसाला व नमक", unit: "kg", stock: 4, lowStockLevel: 1, costPerUnit: 300, perVegTiffin: 0.005, perPaneerTiffin: 0.006 },
  { key: "gas", nameEn: "LPG (19 kg commercial)", nameHi: "गैस सिलेंडर", unit: "cylinder", stock: 2, lowStockLevel: 1, costPerUnit: 1750, perVegTiffin: 0.0025, perPaneerTiffin: 0.0028 },
  { key: "packing", nameEn: "Packing containers", nameHi: "पैकिंग डिब्बे", unit: "pcs", stock: 500, lowStockLevel: 150, costPerUnit: 4, perVegTiffin: 1, perPaneerTiffin: 1 },
];

async function base() {
  for (const a of AREAS) await db.area.upsert({ where: { slug: a.slug }, create: a, update: {} });
  for (const it of ITEMS) await db.inventoryItem.upsert({ where: { key: it.key }, create: it, update: {} });
  console.log(`✓ ${AREAS.length} areas, ${ITEMS.length} inventory items`);
}

async function demo() {
  const areas = await db.area.findMany({ orderBy: { routeSeq: "asc" } });
  const companies = await Promise.all(
    [
      { name: "Shakti Auto Parts", area: 0, address: "Plot 12, Road 3", gateNote: "Gate 2, security cabin", routeSeq: 1 },
      { name: "Ganesh Plastics", area: 0, address: "Plot 48, Road 5", gateNote: "Main gate", routeSeq: 2 },
      { name: "Bharat Steel Fab", area: 1, address: "Shed 7, Sector B", gateNote: "Back gate", routeSeq: 1 },
      { name: "Om Logistics Warehouse", area: 2, address: "Warehouse 21", gateNote: "Dock 4", routeSeq: 1 },
    ].map((c) =>
      db.company.upsert({
        where: { name_areaId: { name: c.name, areaId: areas[c.area].id } },
        create: { name: c.name, areaId: areas[c.area].id, address: c.address, gateNote: c.gateNote, routeSeq: c.routeSeq, contactName: "Supervisor", contactPhone: "9000000001" },
        update: {},
      }),
    ),
  );
  const people = [
    ["Ramesh Kumar", "9811111101", 0], ["Suresh Yadav", "9811111102", 0], ["Pooja Devi", "9811111103", 1],
    ["Imran Khan", "9811111104", 2], ["Mahesh Patel", "9811111105", 3], ["Anil Verma", "9811111106", 2],
  ] as const;
  const customers = await Promise.all(
    people.map(([name, phone, ci]) => db.customer.upsert({ where: { phone }, create: { name, phone, companyId: companies[ci].id }, update: {} })),
  );

  let today = todayDb();
  if (weekday(today) === 0) today = addDays(today, 1);
  const shifts = ["Lunch 12:30 PM", "Lunch 1:30 PM"];
  const rnd = () => Math.random().toString(16).slice(2, 8).toUpperCase();

  // monthly subscribers (one expiring soon to show the reminder)
  for (const [i, c] of customers.slice(0, 4).entries()) {
    const start = addDays(today, i === 0 ? -27 : -5 * i);
    const comp = companies[people[i][2]];
    const order = await db.order.create({
      data: {
        orderNo: `GBDEMO-${rnd()}`, customerId: c.id, companyId: comp.id, areaId: comp.areaId, customerName: c.name, phone: c.phone,
        companyName: comp.name, areaName: areas.find((a) => a.id === comp.areaId)!.nameEn, shift: shifts[i % 2], planType: "MONTHLY",
        qty: i === 2 ? 12 : 1, unitPrice: 1599, amount: 1599 * (i === 2 ? 12 : 1), deliveryDate: start, paymentMethod: "ONLINE", paymentStatus: "PAID", status: "CONFIRMED",
      },
    });
    await db.subscription.create({
      data: { customerId: c.id, companyId: comp.id, orderId: order.id, qty: order.qty, shift: order.shift, startDate: start, endDate: endAfterWorkingDays(start, 26), amount: order.amount, status: "ACTIVE" },
    });
  }
  // daily COD orders for today and tomorrow
  for (const [i, c] of customers.entries()) {
    for (const d of [today, addDays(today, 1)]) {
      if (weekday(d) === 0) continue;
      const comp = companies[people[i][2]];
      const qty = [5, 2, 8, 1, 3, 4][i];
      await db.order.create({
        data: {
          orderNo: `GBDEMO-${rnd()}`, customerId: c.id, companyId: comp.id, areaId: comp.areaId, customerName: c.name, phone: c.phone,
          companyName: comp.name, areaName: areas.find((a) => a.id === comp.areaId)!.nameEn, shift: shifts[i % 2], planType: "DAILY",
          qty, unitPrice: 60, amount: 60 * qty, deliveryDate: d, paymentMethod: "COD", paymentStatus: d === today && i % 2 ? "PAID" : "PENDING",
        },
      });
    }
  }
  for (const [cat, amount, back] of [["Grocery", 4200, 2], ["Gas", 1750, 4], ["Salary", 9000, 1], ["Delivery / Fuel", 600, 0], ["Packaging", 800, 3]] as const) {
    await db.expense.create({ data: { date: addDays(today, -back), category: cat, amount, note: "demo" } });
  }
  console.log("✓ demo factories, customers, orders, subscriptions, expenses");
}

base()
  .then(() => (process.argv.includes("--demo") ? demo() : undefined))
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
