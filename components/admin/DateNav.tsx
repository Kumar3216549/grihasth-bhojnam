"use client";
import { useRouter, usePathname } from "next/navigation";

export default function DateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const path = usePathname();
  const go = (d: string) => router.push(`${path}?date=${d}`);
  const shift = (n: number) => {
    const x = new Date(date + "T00:00:00Z");
    x.setUTCDate(x.getUTCDate() + n);
    go(x.toISOString().slice(0, 10));
  };
  return (
    <div className="flex items-center gap-1">
      <button className="a-btn-ghost !px-2.5" onClick={() => shift(-1)} aria-label="Previous day">‹</button>
      <input type="date" className="a-input !w-auto" value={date} onChange={(e) => e.target.value && go(e.target.value)} />
      <button className="a-btn-ghost !px-2.5" onClick={() => shift(1)} aria-label="Next day">›</button>
      {date !== today && <button className="a-btn-ghost" onClick={() => go(today)}>Today</button>}
      {date === today && <button className="a-btn-ghost" onClick={() => shift(1)}>Tomorrow →</button>}
    </div>
  );
}
