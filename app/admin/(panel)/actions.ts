"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, type OrderStatus } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dbDate, endAfterWorkingDays, todayDb, ymdIST, addDays } from "@/lib/dates";
import { getDayPlan } from "@/lib/kitchen";
import { createOrder, ensureInvoice, invoiceUrl, OrderError, OrderInput } from "@/lib/orders";
import { SETTING_DEFAULTS, getSettings, prices } from "@/lib/settings";
import { sendWhatsApp } from "@/lib/whatsapp";
import { slugify } from "@/lib/format";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const numv = (f: FormData, k: string) => Number(str(f, k)) || 0;

/* ---------------- Orders ---------------- */

const STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export async function setOrderStatus(f: FormData) {
  await requireAdmin();
  const status = str(f, "status") as OrderStatus;
  if (!STATUSES.includes(status)) return;
  await db.order.update({ where: { id: str(f, "id") }, data: { status } });
  revalidatePath("/admin", "layout");
}

/** Mark all of today's open orders for one company as out for delivery / delivered */
export async function setCompanyStatus(f: FormData) {
  await requireAdmin();
  const status = str(f, "status") as OrderStatus;
  if (!STATUSES.includes(status)) return;
  await db.order.updateMany({
    where: { companyId: str(f, "companyId"), deliveryDate: dbDate(str(f, "date")), status: { notIn: ["CANCELLED", "DELIVERED"] } },
    data: { status },
  });
  revalidatePath("/admin", "layout");
}

export async function markCashReceived(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  await db.order.update({ where: { id }, data: { paymentStatus: "PAID" } });
  await ensureInvoice(id);
  revalidatePath("/admin", "layout");
}

export async function addPhoneOrder(f: FormData) {
  await requireAdmin();
  const parsed = OrderInput.safeParse({
    name: str(f, "name"),
    phone: str(f, "phone"),
    company: str(f, "company"),
    areaSlug: str(f, "areaSlug"),
    areaOther: "",
    shift: str(f, "shift"),
    planType: "DAILY",
    thaliType: str(f, "thaliType") || "VEG",
    qty: str(f, "qty") || "1",
    date: str(f, "date") || ymdIST(),
    address: str(f, "address"),
    notes: "Phone/WhatsApp order",
    paymentMethod: "COD",
  });
  if (!parsed.success) redirect("/admin/orders?error=" + encodeURIComponent("Check the form: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ")));
  try {
    await createOrder(parsed.data);
  } catch (e) {
    redirect("/admin/orders?error=" + encodeURIComponent(e instanceof OrderError ? e.message : "Could not save order"));
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/orders?date=${parsed.data.date}&ok=1`);
}

/* ---------------- Subscriptions ---------------- */

export async function subscriptionAction(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const action = str(f, "action");
  const sub = await db.subscription.findUnique({ where: { id }, include: { customer: true, company: true, order: true } });
  if (!sub) return;
  if (action === "pause") await db.subscription.update({ where: { id }, data: { status: "PAUSED" } });
  if (action === "resume") await db.subscription.update({ where: { id }, data: { status: "ACTIVE" } });
  if (action === "cancel") await db.subscription.update({ where: { id }, data: { status: "CANCELLED" } });
  if (action === "extend") {
    const days = Math.max(1, numv(f, "days") || 1);
    // add `days` working days after the current end date (used for factory holidays / late delivery compensation)
    await db.subscription.update({ where: { id }, data: { endDate: endAfterWorkingDays(addDays(sub.endDate, 1), days) } });
  }
  if (action === "activate") {
    await db.subscription.update({ where: { id }, data: { status: "ACTIVE" } });
    if (sub.orderId) {
      await db.order.update({ where: { id: sub.orderId }, data: { paymentStatus: "PAID", status: "CONFIRMED" } });
      await ensureInvoice(sub.orderId);
    }
  }
  if (action === "remind") {
    const s = await getSettings();
    const p = prices(s);
    const msg = `Namaste ${sub.customer.name} 🙏\nAapka Grihasth Bhojnam monthly tiffin plan ${sub.endDate.toISOString().slice(0, 10)} ko khatam ho raha hai.\nRenew karein ₹${p.monthly} me: ${process.env.NEXT_PUBLIC_SITE_URL || ""}/order?plan=MONTHLY\n– व्यापार नहीं, व्यवहार परोसते हैं हम।`;
    await sendWhatsApp(sub.customer.phone, msg, [sub.customer.name, sub.endDate.toISOString().slice(0, 10), `₹${p.monthly}`]);
    await db.subscription.update({ where: { id }, data: { remindedAt: new Date() } });
  }
  revalidatePath("/admin", "layout");
}

/** Daily housekeeping: expire finished subscriptions. Also runs when the subscribers page loads. */
export async function expireSubscriptions() {
  await requireAdmin();
  await db.subscription.updateMany({ where: { status: { in: ["ACTIVE", "PAUSED"] }, endDate: { lt: todayDb() } }, data: { status: "EXPIRED" } });
}

/* ---------------- Inventory ---------------- */

export async function saveInventoryItem(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const data = {
    nameEn: str(f, "nameEn"),
    nameHi: str(f, "nameHi") || str(f, "nameEn"),
    unit: str(f, "unit") || "kg",
    lowStockLevel: numv(f, "lowStockLevel"),
    costPerUnit: numv(f, "costPerUnit"),
    perVegTiffin: numv(f, "perVegTiffin"),
    perPaneerTiffin: numv(f, "perPaneerTiffin"),
  };
  if (!data.nameEn) return;
  if (id) await db.inventoryItem.update({ where: { id }, data });
  else await db.inventoryItem.create({ data: { ...data, key: slugify(data.nameEn) + "-" + Date.now().toString(36), stock: numv(f, "stock") } });
  revalidatePath("/admin", "layout");
}

export async function deleteInventoryItem(f: FormData) {
  await requireAdmin();
  await db.inventoryItem.delete({ where: { id: str(f, "id") } });
  revalidatePath("/admin", "layout");
}

/** Stock IN (purchase → also booked as expense), OUT (used / wasted) or ADJUST (set physical count) */
export async function stockTxn(f: FormData) {
  await requireAdmin();
  const itemId = str(f, "itemId");
  const type = str(f, "type") as "IN" | "OUT" | "ADJUST";
  const qty = numv(f, "qty");
  const rate = numv(f, "rate");
  const note = str(f, "note");
  if (!["IN", "OUT", "ADJUST"].includes(type) || qty < 0 || (type !== "ADJUST" && qty === 0)) return;
  const item = await db.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  await db.$transaction(async (tx) => {
    if (type === "IN") {
      await tx.inventoryItem.update({ where: { id: itemId }, data: { stock: { increment: qty }, ...(rate > 0 ? { costPerUnit: rate } : {}) } });
      if (rate > 0) await tx.expense.create({ data: { date: todayDb(), category: "Grocery", amount: Math.round(qty * rate), note: `${item.nameEn} ${qty} ${item.unit} @ ₹${rate}` } });
    } else if (type === "OUT") {
      await tx.inventoryItem.update({ where: { id: itemId }, data: { stock: { decrement: qty } } });
    } else {
      await tx.inventoryItem.update({ where: { id: itemId }, data: { stock: qty } });
    }
    await tx.stockTxn.create({ data: { itemId, type, qty, rate, note } });
  });
  revalidatePath("/admin", "layout");
}

/** One click after cooking: deduct today's raw material usage from stock, based on the tiffin count */
export async function consumeForDay(f: FormData) {
  await requireAdmin();
  const date = dbDate(str(f, "date") || ymdIST());
  const already = await db.stockTxn.findFirst({ where: { type: "OUT", note: `Kitchen use ${date.toISOString().slice(0, 10)}` } });
  if (already) redirect("/admin/inventory?error=" + encodeURIComponent("Stock for this day is already deducted."));
  const plan = await getDayPlan(date);
  const extra = 1 + plan.bufferPct / 100;
  const items = await db.inventoryItem.findMany();
  await db.$transaction(async (tx) => {
    for (const it of items) {
      const use = Math.round((plan.veg * it.perVegTiffin + plan.paneer * it.perPaneerTiffin) * extra * 1000) / 1000;
      if (use <= 0) continue;
      await tx.inventoryItem.update({ where: { id: it.id }, data: { stock: { decrement: use } } });
      await tx.stockTxn.create({ data: { itemId: it.id, type: "OUT", qty: use, note: `Kitchen use ${date.toISOString().slice(0, 10)}` } });
    }
  });
  revalidatePath("/admin", "layout");
  redirect("/admin/inventory?ok=1");
}

/* ---------------- Expenses ---------------- */

export async function addExpense(f: FormData) {
  await requireAdmin();
  const amount = Math.round(numv(f, "amount"));
  if (amount <= 0) return;
  await db.expense.create({ data: { date: dbDate(str(f, "date") || ymdIST()), category: str(f, "category") || "Other", amount, note: str(f, "note") } });
  revalidatePath("/admin", "layout");
}

export async function deleteExpense(f: FormData) {
  await requireAdmin();
  await db.expense.delete({ where: { id: str(f, "id") } });
  revalidatePath("/admin", "layout");
}

/* ---------------- Routes: areas & companies ---------------- */

export async function saveArea(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const data = { nameEn: str(f, "nameEn"), nameHi: str(f, "nameHi") || str(f, "nameEn"), city: str(f, "city"), routeSeq: numv(f, "routeSeq"), active: f.get("active") === "on" };
  if (!data.nameEn) return;
  if (id) await db.area.update({ where: { id }, data });
  else await db.area.create({ data: { ...data, active: true, slug: slugify(`${data.nameEn} ${data.city}`) } });
  revalidatePath("/", "layout");
}

export async function saveCompany(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const data = {
    name: str(f, "name"),
    areaId: str(f, "areaId") || null,
    address: str(f, "address"),
    gateNote: str(f, "gateNote"),
    contactName: str(f, "contactName"),
    contactPhone: str(f, "contactPhone"),
    mapsUrl: str(f, "mapsUrl"),
    routeSeq: numv(f, "routeSeq"),
  };
  if (!data.name) return;
  if (id) await db.company.update({ where: { id }, data });
  else await db.company.create({ data });
  revalidatePath("/admin", "layout");
}

/* ---------------- Settings & menu ---------------- */

export async function saveSettings(f: FormData) {
  await requireAdmin();
  const keys = Object.keys(SETTING_DEFAULTS);
  await db.$transaction(
    keys
      .filter((k) => f.has(k))
      .map((k) => db.setting.upsert({ where: { key: k }, create: { key: k, value: str(f, k) }, update: { value: str(f, k) } })),
  );
  revalidatePath("/", "layout");
  redirect("/admin/settings?ok=1");
}

export async function saveMenu(f: FormData) {
  await requireAdmin();
  const date = dbDate(str(f, "date"));
  if (str(f, "reset") === "1") {
    await db.dailyMenu.deleteMany({ where: { date } });
  } else {
    const data = { sabjiEn: str(f, "sabjiEn"), sabjiHi: str(f, "sabjiHi") || str(f, "sabjiEn"), isPaneer: f.get("isPaneer") === "on", noteEn: str(f, "noteEn"), noteHi: str(f, "noteHi") };
    if (!data.sabjiEn) return;
    await db.dailyMenu.upsert({ where: { date }, create: { date, ...data }, update: data });
  }
  revalidatePath("/", "layout");
}

export async function resendWhatsApp(f: FormData) {
  await requireAdmin();
  const o = await db.order.findUnique({ where: { id: str(f, "id") }, include: { invoice: true } });
  if (!o) return;
  const { orderMessage, shiftTime } = await import("@/lib/whatsapp");
  const r = await sendWhatsApp(o.phone, orderMessage(o, o.invoice ? invoiceUrl(o.publicToken) : undefined), [o.customerName, shiftTime(o.shift), o.companyName, o.orderNo]);
  if (r.ok) await db.order.update({ where: { id: o.id }, data: { whatsappSent: true } });
  revalidatePath("/admin", "layout");
}
