import Image from "next/image";
import { WEEKLY } from "@/lib/menu";
import type { Dict, Lang } from "@/lib/i18n";
import { Divider } from "./Ornament";

/** "Laziz" weekly menu: Monday–Saturday dishes, Sunday rest day, Wed & Sat Paneer Special. */
export default function WeeklyMenu({ lang, t, todayWd, compact = false }: { lang: Lang; t: Dict; todayWd: number; compact?: boolean }) {
  const L = (d: { en: string; hi: string }) => (lang === "hi" ? d.hi : d.en);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <section className="relative overflow-hidden rounded-3xl border border-earth-100 bg-white p-5 shadow-card sm:p-8" aria-labelledby="weekly-title">
      <div className="mandala-bg pointer-events-none absolute -right-24 -top-24 h-72 w-72 opacity-10" aria-hidden />
      <div className="relative text-center">
        <p className="font-hindi text-base font-bold text-saffron-700">🍽️ {t.weekly.kicker}</p>
        <h2 id="weekly-title" className="h-section mt-1">{t.weekly.title}</h2>
        <Divider className="mt-3" />
        <p className="mt-3 text-sm text-ink/70">{t.weekly.sub}</p>
      </div>
      <ol className={`relative mt-6 grid gap-4 ${compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {order.map((wd) => {
          const day = WEEKLY[wd];
          const isToday = wd === todayWd;
          const rest = day.dishes.length === 0;
          return (
            <li
              key={wd}
              className={`overflow-hidden rounded-2xl border ${isToday ? "border-saffron-400 ring-4 ring-saffron-100" : "border-earth-100"} ${rest ? "bg-leaf-50" : "bg-cream/60"}`}
            >
              <div className="flex items-center justify-between px-4 pt-3">
                <p className="font-bold text-earth-800">
                  <span aria-hidden>{rest ? "🟢" : day.paneer ? "⭐" : "🟡"}</span> {t.weekly.days[wd]}
                </p>
                <span className="flex gap-1">
                  {isToday && <span className="chip bg-saffron-500 text-white">{t.weekly.today}</span>}
                  {day.paneer && <span className="chip bg-saffron-100 text-saffron-800">⭐ {t.weekly.paneer}</span>}
                </span>
              </div>
              {rest ? (
                <p className="px-4 pb-5 pt-3 text-lg font-semibold text-leaf-800">🌿 {t.weekly.rest}</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 p-3">
                  {day.dishes.map((d) => (
                    <li key={d.key} className="overflow-hidden rounded-xl bg-white shadow-sm">
                      <div className="relative aspect-square">
                        <Image src={d.img} alt={L(d)} fill sizes="(min-width:1024px) 12vw, (min-width:640px) 22vw, 45vw" className="object-cover" />
                      </div>
                      <p className="px-2 py-1.5 text-center text-sm font-semibold text-earth-800">
                        <span aria-hidden>{d.emoji}</span> {L(d)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <div className="relative mt-6 text-center">
        <p className="text-sm font-semibold text-saffron-700">❤️ {t.weekly.tagline}</p>
        <p className="mt-1 font-hindi text-lg font-bold italic text-leaf-700">{t.weekly.kicker} — {t.weekly.footer}</p>
      </div>
    </section>
  );
}
