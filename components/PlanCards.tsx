import Link from "next/link";
import { fmt, type Dict } from "@/lib/i18n";
import type { prices } from "@/lib/settings";

type P = ReturnType<typeof prices>;

const Check = () => (
  <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-leaf-600" fill="currentColor" aria-hidden>
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" clipRule="evenodd" />
  </svg>
);

export default function PlanCards({ t, p, cutoff, whatsapp }: { t: Dict; p: P; cutoff: string; whatsapp: string }) {
  const vars = { days: p.days, per: p.perMonthly, paneerExtra: p.paneerExtra, cutoff };
  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily */}
        <div className="card-luxe flex flex-col p-6 sm:p-8">
          <span className="chip w-fit bg-saffron-50 text-saffron-800">☀️ {t.plans.daily}</span>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-extrabold tracking-tight text-ink">₹{p.daily}</span>
            <span className="pb-1.5 text-sm text-ink/60">{t.plans.perDay}</span>
          </div>
          <p className="mt-2 text-sm text-ink/70">{t.plans.dailyDesc}</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {t.plans.features.daily.map((f) => (
              <li key={f} className="flex gap-2.5"><Check />{fmt(f, vars)}</li>
            ))}
          </ul>
          <Link href="/order?plan=DAILY" className="btn-ghost mt-8 w-full">{t.plans.orderToday}</Link>
        </div>

        {/* Monthly */}
        <div className="relative flex flex-col overflow-hidden royal-bg rounded-3xl p-6 text-white shadow-luxe ring-1 ring-gold-400/40 transition duration-300 hover:-translate-y-1 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-400/15 blur-2xl" />
          <span className="chip w-fit bg-gradient-to-r from-gold-300 to-gold-500 text-royal-900">⭐ {t.plans.monthly}</span>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-gold text-5xl font-extrabold tracking-tight">₹{p.monthly.toLocaleString("en-IN")}</span>
            <span className="pb-1.5 text-sm text-white/80">{t.plans.perMonth}</span>
          </div>
          <p className="mt-2 text-sm text-white/90">{fmt(t.plans.monthlyDesc, vars)}</p>
          <p className="mt-3 w-fit rounded-full bg-leaf-600 px-3 py-1 text-xs font-bold">{fmt(t.plans.save, vars)}</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {t.plans.features.monthly.map((f) => (
              <li key={f} className="flex gap-2.5">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-gold-300" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" clipRule="evenodd" /></svg>
                {fmt(f, vars)}
              </li>
            ))}
          </ul>
          <Link href="/order?plan=MONTHLY" className="btn-gold mt-8 w-full">{t.plans.subscribe}</Link>
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-leaf-200 bg-leaf-50 p-5 sm:flex-row">
        <p className="text-sm font-medium text-leaf-900">🏭 {t.plans.bulk}</p>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(t.plans.bulkMsg)}`} target="_blank" rel="noopener" className="btn-green !py-2">
          {t.plans.bulkCta}
        </a>
      </div>
    </div>
  );
}
