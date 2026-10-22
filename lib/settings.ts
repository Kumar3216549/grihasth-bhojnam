import { db } from "./db";

/** Every value the owner can change from /admin/settings. Defaults are used until saved. */
export const SETTING_DEFAULTS = {
  dailyPrice: "60",
  paneerPrice: "75",
  monthlyPrice: "1599",
  monthlyDays: "26",
  bulkPrice: "55",
  paneerDays: "3,6", // 0=Sun … 6=Sat → Wednesday & Saturday
  shifts: "Lunch 12:30 PM|Lunch 1:30 PM|Dinner 7:30 PM|Night shift 11:30 PM",
  orderCutoff: "10:30 AM",
  bufferPercent: "5",
  businessPhone: "+91 90000 00000",
  whatsappNumber: "919000000000",
  kitchenAddress: "Grihasth Bhojnam Kitchen, Industrial Area",
  city: "Your City",
  fssaiNo: "",
  gstin: "",
  upiId: "",
};

export type Settings = { [K in keyof typeof SETTING_DEFAULTS]: string };

export async function getSettings(): Promise<Settings> {
  const s: Settings = { ...SETTING_DEFAULTS };
  try {
    const rows = await db.setting.findMany();
    for (const r of rows) if (r.key in s) (s as Record<string, string>)[r.key] = r.value;
  } catch (e) {
    console.error("[settings] DB not reachable, using defaults", e);
  }
  return s;
}

export function prices(s: Settings) {
  const daily = Number(s.dailyPrice) || 60;
  const paneer = Number(s.paneerPrice) || daily;
  const monthly = Number(s.monthlyPrice) || 1599;
  const days = Number(s.monthlyDays) || 26;
  return { daily, paneer, monthly, days, perMonthly: Math.round(monthly / days), paneerExtra: paneer - daily, bulk: Number(s.bulkPrice) || daily };
}

export const shiftList = (s: Settings) => s.shifts.split("|").map((x) => x.trim()).filter(Boolean);
export const paneerDayList = (s: Settings) => s.paneerDays.split(",").map((x) => Number(x.trim())).filter((n) => n >= 0 && n <= 6);
