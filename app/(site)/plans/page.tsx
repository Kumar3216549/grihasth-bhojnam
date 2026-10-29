import Image from "next/image";
import type { Metadata } from "next";
import PlanCards from "@/components/PlanCards";
import { getDict } from "@/lib/lang";
import { getSettings, prices } from "@/lib/settings";
import { IMAGES } from "@/lib/images";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Plans — ₹87 Daily, ₹2080 Monthly Tiffin",
  description: "Sasta monthly tiffin plan ₹2080 (26 days) and daily tiffin ₹87 for factory workers and office staff. Prepay by UPI or pre-book with cash on delivery.",
  alternates: { canonical: "/plans" },
};

export default async function PlansPage() {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const faqs = t.plans.faqs;
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="royal-bg relative overflow-hidden rounded-[2rem] p-6 shadow-luxe ring-1 ring-gold-400/30 sm:p-10">
        <div className="mandala-bg pointer-events-none absolute -right-32 -top-32 h-96 w-96 animate-spinslow opacity-10" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow-gold">✦ {t.nav.plans}</p>
            <h1 className="text-gold mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{t.plans.title}</h1>
            <div className="gold-line mt-5 max-w-xs" aria-hidden />
            <p className="mt-5 text-lg text-white/75">{t.plans.sub}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="glass px-4 py-2 text-sm font-semibold text-gold-100">{t.plans.daily} · ₹{p.daily}</span>
              <span className="glass px-4 py-2 text-sm font-semibold text-gold-100">{t.plans.monthly} · ₹{p.monthly.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gold-400/20 blur-2xl" aria-hidden />
            <div className="gold-frame relative">
              <div className="relative aspect-[500/431] overflow-hidden rounded-[2rem]">
                <Image src={IMAGES.plansTiffin} alt={t.plans.imgAlt} fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10"><PlanCards t={t} p={p} cutoff={s.orderCutoff} whatsapp={s.whatsappNumber} /></div>
      <section className="mt-14">
        <h2 className="h-section">{t.plans.faqTitle}</h2>
        <div className="mt-5 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="card group p-5">
              <summary className="cursor-pointer list-none font-semibold">{q}<span className="float-right text-saffron-600 group-open:rotate-45">＋</span></summary>
              <p className="mt-2 text-sm text-ink/70">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
