import Image from "next/image";
import type { Metadata } from "next";
import PlanCards from "@/components/PlanCards";
import { getDict } from "@/lib/lang";
import { getSettings, prices } from "@/lib/settings";
import { IMAGES } from "@/lib/images";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Plans — ₹60 Daily, ₹1599 Monthly Tiffin",
  description: "Sasta monthly tiffin plan ₹1599 (26 days) and daily tiffin ₹60 for factory workers and office staff. Prepay by UPI or pre-book with cash on delivery.",
  alternates: { canonical: "/plans" },
};

export default async function PlansPage() {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const faqs = t.plans.faqs;
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold text-earth-800 sm:text-4xl">{t.plans.title}</h1>
          <p className="mt-3 text-lg text-ink/70">{t.plans.sub}</p>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
          <Image src={IMAGES.thaliTop} alt={t.plans.imgAlt} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
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
