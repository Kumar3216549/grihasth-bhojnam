import { db } from "./db";
import { addDays, weekday } from "./dates";
import { getSettings, paneerDayList } from "./settings";
import { isPaneerOn } from "./menu";

export type PlanLine = {
  key: string;
  source: "ORDER" | "SUBSCRIPTION";
  orderId?: string;
  subscriptionId?: string;
  orderNo?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  amount?: number;
  customerName: string;
  phone: string;
  companyId: string | null;
  companyName: string;
  areaId: string | null;
  areaName: string;
  routeSeq: number;
  areaSeq: number;
  address: string;
  shift: string;
  veg: number;
  paneer: number;
};

/**
 * Everything the kitchen must cook and deliver on `date`:
 * daily orders for that date (COD, or online & paid) + every active monthly subscription covering that date.
 */
export async function getDayPlan(date: Date) {
  const s = await getSettings();
  const isPaneerDay = await isPaneerOn(date, paneerDayList(s));
  const closed = weekday(date) === 0;

  const [orders, subs] = await Promise.all([
    db.order.findMany({
      where: {
        planType: "DAILY",
        deliveryDate: date,
        status: { not: "CANCELLED" },
        OR: [{ paymentMethod: "COD" }, { paymentStatus: "PAID" }],
      },
      include: { company: true, area: true },
    }),
    closed
      ? Promise.resolve([])
      : db.subscription.findMany({
          where: { status: "ACTIVE", startDate: { lte: date }, endDate: { gte: date } },
          include: { company: { include: { area: true } }, customer: true },
        }),
  ]);

  const lines: PlanLine[] = [
    ...orders.map((o) => ({
      key: "o" + o.id,
      source: "ORDER" as const,
      orderId: o.id,
      orderNo: o.orderNo,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      amount: o.amount,
      customerName: o.customerName,
      phone: o.phone,
      companyId: o.companyId,
      companyName: o.company?.name ?? o.companyName,
      areaId: o.areaId,
      areaName: o.area?.nameEn ?? o.areaName,
      routeSeq: o.company?.routeSeq ?? 0,
      areaSeq: o.area?.routeSeq ?? 0,
      address: o.company?.address || o.address,
      shift: o.shift,
      veg: o.thaliType === "VEG" ? o.qty : 0,
      paneer: o.thaliType === "PANEER" ? o.qty : 0,
    })),
    ...subs.map((sb) => ({
      key: "s" + sb.id,
      source: "SUBSCRIPTION" as const,
      subscriptionId: sb.id,
      customerName: sb.customer.name,
      phone: sb.customer.phone,
      companyId: sb.companyId,
      companyName: sb.company?.name ?? "—",
      areaId: sb.company?.areaId ?? null,
      areaName: sb.company?.area?.nameEn ?? "—",
      routeSeq: sb.company?.routeSeq ?? 0,
      areaSeq: sb.company?.area?.routeSeq ?? 0,
      address: sb.company?.address ?? sb.customer.address,
      shift: sb.shift,
      veg: isPaneerDay ? 0 : sb.qty,
      paneer: isPaneerDay ? sb.qty : 0,
    })),
  ];

  const veg = lines.reduce((a, l) => a + l.veg, 0);
  const paneer = lines.reduce((a, l) => a + l.paneer, 0);
  const total = veg + paneer;
  const bufferPct = Number(s.bufferPercent) || 0;
  const buffer = total ? Math.ceil((total * bufferPct) / 100) : 0;

  // group by company (= one delivery stop)
  const stops = new Map<string, { companyId: string | null; companyName: string; areaName: string; areaSeq: number; routeSeq: number; address: string; shifts: Record<string, number>; veg: number; paneer: number; lines: PlanLine[] }>();
  for (const l of lines) {
    const k = l.companyId ?? l.companyName;
    const st = stops.get(k) ?? { companyId: l.companyId, companyName: l.companyName, areaName: l.areaName, areaSeq: l.areaSeq, routeSeq: l.routeSeq, address: l.address, shifts: {}, veg: 0, paneer: 0, lines: [] };
    st.veg += l.veg;
    st.paneer += l.paneer;
    st.shifts[l.shift] = (st.shifts[l.shift] || 0) + l.veg + l.paneer;
    st.lines.push(l);
    stops.set(k, st);
  }
  const byCompany = [...stops.values()].sort((a, b) => a.areaSeq - b.areaSeq || a.routeSeq - b.routeSeq || a.companyName.localeCompare(b.companyName));

  const byShift: Record<string, number> = {};
  for (const l of lines) byShift[l.shift] = (byShift[l.shift] || 0) + l.veg + l.paneer;

  return { date, closed, isPaneerDay, lines, veg, paneer, total, buffer, bufferPct, toCook: total + buffer, byCompany, byShift };
}

/** Raw material needed for a plan vs current stock */
export async function getRequirements(veg: number, paneer: number) {
  const items = await db.inventoryItem.findMany({ orderBy: { nameEn: "asc" } });
  return items.map((it) => {
    const need = veg * it.perVegTiffin + paneer * it.perPaneerTiffin;
    return { ...it, need, short: Math.max(0, need - it.stock), low: it.lowStockLevel > 0 && it.stock <= it.lowStockLevel };
  });
}

/** Ingredient cost of one tiffin, from inventory recipe × purchase rate */
export async function costPerTiffin() {
  const items = await db.inventoryItem.findMany();
  return {
    veg: items.reduce((a, i) => a + i.perVegTiffin * i.costPerUnit, 0),
    paneer: items.reduce((a, i) => a + i.perPaneerTiffin * i.costPerUnit, 0),
  };
}

/** Tiffins served per day in a range (for the P&L chart). Small loops are fine at tiffin-business scale. */
export async function tiffinsInRange(start: Date, end: Date) {
  const out: { date: Date; veg: number; paneer: number }[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const p = await getDayPlan(d);
    out.push({ date: new Date(d), veg: p.veg, paneer: p.paneer });
  }
  return out;
}
