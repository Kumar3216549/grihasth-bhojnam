// The business runs on Indian time. Servers are often UTC, so always compute "today" in Asia/Kolkata.
export const TZ = "Asia/Kolkata";

/** YYYY-MM-DD for a moment, in IST */
export function ymdIST(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Convert YYYY-MM-DD into the Date Prisma stores in a @db.Date column */
export function dbDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function todayDb(): Date {
  return dbDate(ymdIST());
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** 0 = Sunday … 6 = Saturday, for a @db.Date value */
export function weekday(d: Date): number {
  return d.getUTCDay();
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** End date after `days` working days (Mon–Sat), counting the start date */
export function endAfterWorkingDays(start: Date, days: number): Date {
  let d = new Date(start);
  let count = 0;
  while (true) {
    if (weekday(d) !== 0) count++;
    if (count >= days) return d;
    d = addDays(d, 1);
  }
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function fmtDate(d: Date, lang: "hi" | "en" = "en"): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

export function monthRange(ym: string): { start: Date; end: Date } {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return { start, end };
}
