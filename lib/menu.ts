import { db } from "./db";
import { addDays, weekday } from "./dates";

/**
 * Every thali: 4 tawa roti · rice · dal · sabji · salad (+ 2 mukhwas, 2 tissue).
 * The day's sabji / dal follow the Laziz weekly menu below (Wed & Sat = Paneer Special).
 * A saved DailyMenu row (from /admin/settings) wins; otherwise the settings decide.
 */
export type RiceType = "jeera" | "plain";
export type MenuDay = { date: Date; isPaneer: boolean; rice: RiceType; closed: boolean; dishes: WeekDish[] };

/* ---------- Laziz weekly menu (the day's sabji / dal, served with the fixed thali) ---------- */
export type WeekDish = { key: string; en: string; hi: string; emoji: string; img: string };
const D = (key: string, en: string, hi: string, emoji: string): WeekDish => ({ key, en, hi, emoji, img: `/photos/week/${key}.webp` });
export const WEEK_DISHES = {
  alooGobhi: D("aloo-gobhi", "Aloo Gobhi", "आलू गोभी", "🥔"),
  dalFry: D("dal-fry", "Dal Fry", "दाल फ्राई", "🍲"),
  mixVeg: D("mix-veg", "Mix Veg", "मिक्स वेज", "🥦"),
  dalTadka: D("dal-tadka", "Dal Tadka", "दाल तड़का", "🍲"),
  paneerButterMasala: D("paneer-butter-masala", "Paneer Butter Masala", "पनीर बटर मसाला", "🧀"),
  rajma: D("rajma", "Rajma", "राजमा", "🫘"),
  jeeraRice: D("jeera-rice", "Jeera Rice", "जीरा राइस", "🍚"),
  chhole: D("chhole", "Chhole", "छोले", "🫘"),
  matarPaneer: D("matar-paneer", "Matar Paneer", "मटर पनीर", "🧀"),
};
const W = WEEK_DISHES;
/** index = weekday (0 = Sunday). Sunday is the kitchen rest day. */
export const WEEKLY: { dishes: WeekDish[]; paneer: boolean }[] = [
  { dishes: [], paneer: false },
  { dishes: [W.alooGobhi, W.dalFry], paneer: false },
  { dishes: [W.mixVeg, W.dalTadka], paneer: false },
  { dishes: [W.paneerButterMasala, W.dalFry], paneer: true },
  { dishes: [W.rajma, W.jeeraRice], paneer: false },
  { dishes: [W.chhole, W.mixVeg], paneer: false },
  { dishes: [W.matarPaneer, W.dalFry], paneer: true },
];

const asRice = (v: string | undefined, fallback: RiceType): RiceType => (v === "plain" || v === "jeera" ? v : fallback);

export async function getMenu(date: Date, paneerDays: number[], defaultRice: string = "jeera"): Promise<MenuDay> {
  const closed = weekday(date) === 0;
  const fallbackRice = asRice(defaultRice, "jeera");
  try {
    const row = await db.dailyMenu.findUnique({ where: { date } });
    if (row) return { date, isPaneer: row.isPaneer && !closed, rice: asRice(row.riceType, fallbackRice), closed, dishes: WEEKLY[weekday(date)].dishes };
  } catch {}
  return { date, isPaneer: paneerDays.includes(weekday(date)) && !closed, rice: fallbackRice, closed, dishes: WEEKLY[weekday(date)].dishes };
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
  dal: { en: "Dal (Dal Fry / Dal Tadka)", hi: "दाल (दाल फ्राई / दाल तड़का)" },
  sabji: { en: "Sabji of the day (Laziz weekly menu)", hi: "दिन की सब्ज़ी (लज़ीज़ साप्ताहिक मेन्यू)" },
  mixVeg: { en: "Mix Veg", hi: "मिक्स वेज" },
  paneer: { en: "Paneer Special sabji", hi: "पनीर स्पेशल सब्ज़ी" },
  salad: { en: "Salad", hi: "सलाद" },
} as const;

/** Fixed packing items included with EVERY meal / tiffin (not food categories, not optional). */
export const INCLUDED = [
  { key: "mukhwas", en: "2 Packets of Mukhwas", hi: "2 पैकेट मुखवास" },
  { key: "tissue", en: "2 Pieces of Tissue Paper", hi: "2 पीस टिश्यू पेपर" },
] as const;
