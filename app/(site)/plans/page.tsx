import Image from "next/image";
import type { Metadata } from "next";
import PlanCards from "@/components/PlanCards";
import { getDict } from "@/lib/lang";
import { getSettings, prices } from "@/lib/settings";
import { IMAGES } from "@/lib/images";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Plans — ₹60 Daily, ₹1599 Monthly Tiffin",
  description: "Sasta monthly tiffin plan ₹1599 (26 days) and daily tiffin ₹60 for factory workers and office staff. Subscribe online with UPI, card or netbanking.",
  alternates: { canonical: "/plans" },
};

export default async function PlansPage() {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const faqs = lang === "hi"
    ? [
        ["छुट्टी के दिन क्या होगा?", "रविवार को रसोई बंद रहती है। फैक्ट्री की छुट्टी पहले बताएं — वह दिन आगे जोड़ दिया जाएगा।"],
        ["क्या पूरी टीम के लिए एक साथ ले सकते हैं?", "हाँ। ऑर्डर फॉर्म में टिफ़िन की संख्या डालें। 20+ टिफ़िन पर बल्क रेट मिलता है।"],
        ["पेमेंट कैसे करें?", "डेली में डिलीवरी पर कैश या ऑनलाइन। मंथली प्लान UPI / कार्ड / नेटबैंकिंग से — बिल WhatsApp पर आता है।"],
      ]
    : [
        ["What about holidays?", "Kitchen is closed on Sundays. Tell us factory holidays in advance — those days are added at the end."],
        ["Can we order for the whole team?", "Yes. Enter number of tiffins in the order form. 20+ tiffins get the bulk rate."],
        ["How do I pay?", "Daily: cash on delivery or online. Monthly: UPI / card / netbanking — invoice on WhatsApp."],
      ];
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.plans.title}</h1>
          <p className="mt-3 text-lg text-ink/70">{t.plans.sub}</p>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
          <Image src={IMAGES.curryBowls} alt="Dal, sabji and roti" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </div>
      <div className="mt-10"><PlanCards t={t} p={p} cutoff={s.orderCutoff} whatsapp={s.whatsappNumber} /></div>
      <section className="mt-14">
        <h2 className="h-section">FAQ</h2>
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
