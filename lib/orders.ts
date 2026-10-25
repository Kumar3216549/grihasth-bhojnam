import crypto from "crypto";
import { z } from "zod";
import { db, Prisma } from "./db";
import { dbDate, endAfterWorkingDays, weekday, ymdIST } from "./dates";
import { cleanPhone, slugify } from "./format";
import { getSettings, paneerDayList, prices, shiftList, upiReady } from "./settings";
import { orderMessage, sendWhatsApp, shiftTime } from "./whatsapp";
import { SITE_URL } from "./site";
import { isPaneerOn } from "./menu";

export const OrderInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().transform(cleanPhone).refine((p) => /^[6-9]\d{9}$/.test(p), "Invalid mobile"),
  company: z.string().trim().min(2).max(120),
  areaSlug: z.string().trim().max(80).optional().default(""),
  areaOther: z.string().trim().max(80).optional().default(""),
  shift: z.string().trim().min(1).max(60),
  planType: z.enum(["DAILY", "MONTHLY"]),
  thaliType: z.enum(["VEG", "PANEER"]).default("VEG"),
  qty: z.coerce.number().int().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(300).optional().default(""),
  /** COD = pre-order, pay cash at delivery. UPI = prepaid to the owner's UPI, verified by admin. */
  paymentMethod: z.enum(["COD", "UPI"]),
  /** Random key from the order form — the same key never creates a second order */
  clientKey: z.string().trim().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
});
export type OrderInputT = z.infer<typeof OrderInput>;

export type OrderErrorCode = "shift" | "past" | "sunday" | "monthlyPrepaid" | "paneer" | "upi" | "generic";
export class OrderError extends Error {
  constructor(message: string, public code: OrderErrorCode = "generic") {
    super(message);
  }
}

function orderNo() {
  const d = ymdIST().slice(2).replace(/-/g, "");
  return `GB${d}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Validates business rules, prices the order on the server, and saves it. */
export async function createOrder(input: OrderInputT) {
  const s = await getSettings();
  const p = prices(s);

  if (!shiftList(s).includes(input.shift)) throw new OrderError("Invalid shift", "shift");
  const date = dbDate(input.date);
  if (input.date < ymdIST()) throw new OrderError("Date is in the past", "past");
  if (weekday(date) === 0) throw new OrderError("Kitchen is closed on Sunday", "sunday");
  if (input.paymentMethod === "UPI" && !upiReady(s)) throw new OrderError("UPI prepayment is not set up yet", "upi");
  if (input.planType === "MONTHLY" && input.paymentMethod !== "UPI") throw new OrderError("Monthly plan must be prepaid", "monthlyPrepaid");

  // Duplicate protection: a repeated submit with the same key returns the order already created.
  if (input.clientKey) {
    const existing = await db.order.findFirst({ where: { clientKey: input.clientKey } });
    if (existing) return existing;
  }

  let thaliType = input.thaliType;
  if (input.planType === "MONTHLY") thaliType = "VEG"; // paneer days are included automatically
  if (thaliType === "PANEER" && !(await isPaneerOn(date, paneerDayList(s)))) throw new OrderError("Paneer butter masala is not available on this date", "paneer");

  const unitPrice = input.planType === "MONTHLY" ? p.monthly : thaliType === "PANEER" ? p.paneer : p.daily;
  const amount = unitPrice * input.qty;

  // Area: pick a known one, or create an inactive one from "other" so the owner can review it.
  let area = input.areaSlug ? await db.area.findUnique({ where: { slug: input.areaSlug } }) : null;
  if (!area) {
    const other = input.areaOther || "Other";
    area =
      (await db.area.findFirst({ where: { nameEn: { equals: other, mode: "insensitive" } } })) ??
      (await db.area.create({ data: { nameEn: other, nameHi: other, slug: `${slugify(other)}-${crypto.randomBytes(2).toString("hex")}`, active: false } }));
  }

  const company =
    (await db.company.findFirst({ where: { areaId: area.id, name: { equals: input.company, mode: "insensitive" } } })) ??
    (await db.company.create({ data: { name: input.company, areaId: area.id, address: input.address } }));

  const customer = await db.customer.upsert({
    where: { phone: input.phone },
    create: { name: input.name, phone: input.phone, companyId: company.id, address: input.address },
    update: { name: input.name, companyId: company.id, address: input.address || undefined },
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNo: orderNo(),
            customerId: customer.id,
            companyId: company.id,
            areaId: area!.id,
            customerName: input.name,
            phone: input.phone,
            companyName: company.name,
            areaName: area!.nameEn,
            address: input.address,
            shift: input.shift,
            planType: input.planType,
            thaliType,
            qty: input.qty,
            unitPrice,
            amount,
            deliveryDate: date,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
            clientKey: input.clientKey,
          },
        });
        if (input.planType === "MONTHLY") {
          await tx.subscription.create({
            data: {
              customerId: customer.id,
              companyId: company.id,
              orderId: order.id,
              qty: input.qty,
              shift: input.shift,
              startDate: date,
              endDate: endAfterWorkingDays(date, p.days),
              amount,
            },
          });
        }
        return order;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 2) continue; // orderNo clash
      throw e;
    }
  }
  throw new OrderError("Could not create order");
}

function financialYear(d = new Date()) {
  const ymd = ymdIST(d);
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7));
  const start = m >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient) {
  const fy = financialYear();
  const prefix = `GB/${fy}/`;
  const last = await tx.invoice.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" } });
  const n = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
  return prefix + String(n).padStart(5, "0");
}

export async function ensureInvoice(orderId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const existing = await tx.invoice.findUnique({ where: { orderId } });
        if (existing) return existing;
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
        return tx.invoice.create({ data: { orderId, amount: order.amount, number: await nextInvoiceNumber(tx) } });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 2) continue;
      throw e;
    }
  }
}

/** Idempotent. Called by an admin after checking the money arrived (UPI), or by the Razorpay webhook. */
export async function markPaid(orderId: string, paymentId: string | null) {
  const updated = await db.order.updateMany({
    where: { id: orderId, paymentStatus: { not: "PAID" } },
    data: { paymentStatus: "PAID", status: "CONFIRMED", razorpayPaymentId: paymentId ?? undefined, paymentVerifiedAt: new Date() },
  });
  await ensureInvoice(orderId);
  await db.subscription.updateMany({ where: { orderId, status: "PENDING_PAYMENT" }, data: { status: "ACTIVE" } });
  if (updated.count > 0) await notifyCustomer(orderId);
}

export const invoiceUrl = (token: string) => `${SITE_URL}/invoice/${token}`;

export async function notifyCustomer(orderId: string) {
  const o = await db.order.findUnique({ where: { id: orderId }, include: { invoice: true } });
  if (!o || o.whatsappSent) return;
  const link = o.invoice ? invoiceUrl(o.publicToken) : undefined;
  const r = await sendWhatsApp(o.phone, orderMessage(o, link), [o.customerName, shiftTime(o.shift), o.companyName, o.orderNo]);
  if (r.ok) await db.order.update({ where: { id: o.id }, data: { whatsappSent: true } });
}
