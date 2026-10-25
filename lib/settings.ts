import { db } from "./db";

/** Every value the owner can change from /admin/settings. Defaults are used until saved. */
export const SETTING_DEFAULTS = {
  dailyPrice: "80",
  paneerPrice: "95",
  monthlyPrice: "2100",
  monthlyDays: "26",
  bulkPrice: "75",
  paneerDays: "3,6", // 0=Sun … 6=Sat → Wednesday & Saturday
  shifts: "Lunch 12:30 PM|Lunch 1:30 PM|Dinner 7:30 PM|Night shift 11:30 PM",
  orderCutoff: "10:30 AM",
  bufferPercent: "5",
  businessPhone: "+91 84348 16583",
  whatsappNumber: "918434816583",
  email: "sachinjha608@gmail.com",
  kitchenAddress: "Grihasth Bhojnam Kitchen, Odhav, Ahmedabad",
  city: "Ahmedabad",
  fssaiNo: "",
  gstin: "",
  // Prepaid orders are paid ONLY to the owner's own UPI. Leave blank until Sachin adds the real details —
  // the website then hides the prepaid option and asks customers to choose COD.
  upiId: "",
  upiPayeeName: "Grihasth Bhojnam",
  upiQrUrl: "", // e.g. /photos/upi-qr.png after uploading the QR image, or a full https:// link
  riceType: "jeera", // "jeera" or "plain" — default rice when a day has no override
};

/** Old placeholder values that may still be saved in the database from the first setup */
const OLD_PLACEHOLDERS: Partial<Record<keyof typeof SETTING_DEFAULTS, string[]>> = {
  businessPhone: ["+91 90000 00000"],
  // prices before the Oct 2026 change (₹80 thali, ₹2100 monthly)
  dailyPrice: ["60"],
  paneerPrice: ["75"],
  monthlyPrice: ["1599"],
  bulkPrice: ["55"],
  whatsappNumber: ["919000000000"],
};

export type Settings = { [K in keyof typeof SETTING_DEFAULTS]: string };

export async function getSettings(): Promise<Settings> {
  const s: Settings = { ...SETTING_DEFAULTS };
  try {
    const rows = await db.setting.findMany();
    for (const r of rows) {
      if (!(r.key in s)) continue;
      const k = r.key as keyof Settings;
      if (OLD_PLACEHOLDERS[k]?.includes(r.value.trim())) continue;
      (s as Record<string, string>)[k] = r.value;
    }
  } catch (e) {
    console.error("[settings] DB not reachable, using defaults", e);
  }
  return s;
}

export function prices(s: Settings) {
  const daily = Number(s.dailyPrice) || 80;
  const paneer = Number(s.paneerPrice) || daily;
  const monthly = Number(s.monthlyPrice) || 2100;
  const days = Number(s.monthlyDays) || 26;
  return { daily, paneer, monthly, days, perMonthly: Math.round(monthly / days), paneerExtra: paneer - daily, bulk: Number(s.bulkPrice) || daily };
}

export const shiftList = (s: Settings) => s.shifts.split("|").map((x) => x.trim()).filter(Boolean);
export const paneerDayList = (s: Settings) => s.paneerDays.split(",").map((x) => Number(x.trim())).filter((n) => n >= 0 && n <= 6);

/** Prepaid UPI is offered only when the owner has added a real UPI ID or QR image. */
export const upiReady = (s: Settings) => Boolean(s.upiId.trim() || s.upiQrUrl.trim());
export const telHref = (phone: string) => "tel:" + (phone.replace(/\D/g, "").length === 10 ? "+91" : "+") + phone.replace(/\D/g, "");
