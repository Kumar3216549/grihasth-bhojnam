import { db } from "./db";
import { addDays, weekday } from "./dates";

/**
 * The menu is FIXED every day — exactly five categories:
 *   4 tawa roti · jeera rice / plain rice · dal fry · mix veg / paneer butter masala · salad
 * Only two things vary by date: which rice is cooked, and whether paneer butter masala is available.
 * A saved DailyMenu row (from /admin/settings) wins; otherwise the settings decide.
 */
export type RiceType = "jeera" | "plain";
export type MenuDay = { date: Date; isPaneer: boolean; rice: RiceType; closed: boolean };

const asRice = (v: string | undefined, fallback: RiceType): RiceType => (v === "plain" || v === "jeera" ? v : fallback);

export async function getMenu(date: Date, paneerDays: number[], defaultRice: string = "jeera"): Promise<MenuDay> {
  const closed = weekday(date) === 0;
  const fallbackRice = asRice(defaultRice, "jeera");
  try {
    const row = await db.dailyMenu.findUnique({ where: { date } });
    if (row) return { date, isPaneer: row.isPaneer && !closed, rice: asRice(row.riceType, fallbackRice), closed };
  } catch {}
  return { date, isPaneer: paneerDays.includes(weekday(date)) && !closed, rice: fallbackRice, closed };
}

export async function getWeekMenu(start: Date, paneerDays: number[], defaultRice?: string) {
  const days: MenuDay[] = [];
  for (let i = 0; i < 7; i++) days.push(await getMenu(addDays(start, i), paneerDays, defaultRice));
  return days;
}

/** Single source of truth for "is paneer butter masala available on this date". */
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

/** Names used everywhere (website, order summary, admin). */
export const DISH = {
  roti: { en: "4 Tawa Roti", hi: "4 तवा रोटी" },
  rice: { en: "Jeera Rice / Plain Rice", hi: "जीरा राइस / सादा चावल" },
  jeera: { en: "Jeera Rice", hi: "जीरा राइस" },
  plain: { en: "Plain Rice", hi: "सादा चावल" },
  dal: { en: "Dal Fry", hi: "दाल फ्राई" },
  sabji: { en: "Mix Veg / Paneer Butter Masala", hi: "मिक्स वेज / पनीर बटर मसाला" },
  mixVeg: { en: "Mix Veg", hi: "मिक्स वेज" },
  paneer: { en: "Paneer Butter Masala", hi: "पनीर बटर मसाला" },
  salad: { en: "Salad", hi: "सलाद" },
} as const;

/** Fixed packing items included with EVERY meal / tiffin (not food categories, not optional). */
export const INCLUDED = [
  { key: "mukhwas", en: "2 Packets of Mukhwas", hi: "2 पैकेट मुखवास" },
  { key: "tissue", en: "2 Pieces of Tissue Paper", hi: "2 पीस टिश्यू पेपर" },
] as const;
