import { db } from "./db";
import { addDays, weekday } from "./dates";

export type MenuDay = { date: Date; sabjiEn: string; sabjiHi: string; isPaneer: boolean; noteEn: string; noteHi: string; closed: boolean };

// Default weekly rotation (index = weekday, 0 = Sunday). Owner can override any date from /admin/settings.
const ROTATION: { en: string; hi: string }[] = [
  { en: "Closed", hi: "बंद" },
  { en: "Aloo Gobhi + Dal Fry", hi: "आलू गोभी + दाल फ्राई" },
  { en: "Mix Veg + Dal Tadka", hi: "मिक्स वेज + दाल तड़का" },
  { en: "Paneer Butter Masala + Dal Fry", hi: "पनीर बटर मसाला + दाल फ्राई" },
  { en: "Rajma + Jeera Rice", hi: "राजमा + जीरा राइस" },
  { en: "Chhole + Mix Veg", hi: "छोले + मिक्स वेज" },
  { en: "Matar Paneer + Dal Fry", hi: "मटर पनीर + दाल फ्राई" },
];

export async function getMenu(date: Date, paneerDays: number[]): Promise<MenuDay> {
  const wd = weekday(date);
  try {
    const row = await db.dailyMenu.findUnique({ where: { date } });
    if (row) return { ...row, closed: false };
  } catch {}
  const r = ROTATION[wd];
  const isPaneer = paneerDays.includes(wd);
  return { date, sabjiEn: r.en, sabjiHi: r.hi, isPaneer, noteEn: "", noteHi: "", closed: wd === 0 };
}

export async function getWeekMenu(start: Date, paneerDays: number[]) {
  const days: MenuDay[] = [];
  for (let i = 0; i < 7; i++) days.push(await getMenu(addDays(start, i), paneerDays));
  return days;
}

/** Single source of truth for "is this a paneer day": a saved menu row wins, otherwise the weekly setting. */
export async function isPaneerOn(date: Date, paneerDays: number[]) {
  const m = await getMenu(date, paneerDays);
  return m.isPaneer && !m.closed;
}

/** YYYY-MM-DD list of paneer days in the next `n` days (for the order form) */
export async function paneerDatesAhead(start: Date, n: number, paneerDays: number[]) {
  const rows = await db.dailyMenu.findMany({ where: { date: { gte: start, lte: addDays(start, n) } } }).catch(() => []);
  const override = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r.isPaneer]));
  const out: string[] = [];
  for (let i = 0; i <= n; i++) {
    const d = addDays(start, i);
    const k = d.toISOString().slice(0, 10);
    const on = override.has(k) ? override.get(k)! : paneerDays.includes(weekday(d));
    if (on && weekday(d) !== 0) out.push(k);
  }
  return out;
}
