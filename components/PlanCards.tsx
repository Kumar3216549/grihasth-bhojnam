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
        <div className="card flex flex-col p-6 sm:p-8">
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
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 p-6 text-white shadow-card sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <span className="chip w-fit bg-white/20 text-white">⭐ {t.plans.monthly}</span>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-extrabold tracking-tight">₹{p.monthly.toLocaleString("en-IN")}</span>
            <span className="pb-1.5 text-sm text-white/80">{t.plans.perMonth}</span>
          </div>
          <p className="mt-2 text-sm text-white/90">{fmt(t.plans.monthlyDesc, vars)}</p>
          <p className="mt-3 w-fit rounded-full bg-leaf-600 px-3 py-1 text-xs font-bold">{fmt(t.plans.save, vars)}</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {t.plans.features.monthly.map((f) => (
              <li key={f} className="flex gap-2.5">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-white" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" clipRule="evenodd" /></svg>
                {fmt(f, vars)}
              </li>
            ))}
          </ul>
          <Link href="/order?plan=MONTHLY" className="btn mt-8 w-full bg-white text-saffron-700 hover:bg-saffron-50">{t.plans.subscribe}</Link>
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-leaf-200 bg-leaf-50 p-5 sm:flex-row">
        <p className="text-sm font-medium text-leaf-900">🏭 {t.plans.bulk}</p>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Namaste, bulk tiffin rate for our factory?")}`} target="_blank" rel="noopener" className="btn-green !py-2">
          {t.plans.bulkCta}
        </a>
      </div>
    </div>
  );
}
