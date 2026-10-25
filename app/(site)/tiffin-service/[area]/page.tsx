import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlanCards from "@/components/PlanCards";
import { db } from "@/lib/db";
import { getDict } from "@/lib/lang";
import { getSettings, prices } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function getArea(slug: string) {
  try { return await db.area.findUnique({ where: { slug }, include: { companies: { select: { name: true } } } }); } catch { return null; }
}

export async function generateMetadata({ params }: { params: { area: string } }): Promise<Metadata> {
  const a = await getArea(params.area);
  if (!a) return {};
  const s = await getSettings();
  const p = prices(s);
  return {
    title: `Tiffin Service in ${a.nameEn} — Factory Tiffin Delivery ₹${p.daily}`,
    description: `Sasta monthly tiffin (₹${p.monthly}) and daily tiffin (₹${p.daily}) delivery to factories and companies in ${a.nameEn}${a.city ? ", " + a.city : ""}. ${a.nameHi} में टिफ़िन सर्विस.`,
    alternates: { canonical: `/tiffin-service/${a.slug}` },
  };
}

export default async function AreaPage({ params }: { params: { area: string } }) {
  const a = await getArea(params.area);
  if (!a) notFound();
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const name = lang === "hi" ? a.nameHi : a.nameEn;
  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold sm:text-4xl">
        {lang === "hi" ? `${name} में टिफ़िन सर्विस` : `Tiffin service in ${name}`}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink/70">
        {lang === "hi"
          ? `${name} की फैक्ट्रियों और कंपनियों में रोज़ घर जैसा टिफ़िन — ₹${p.daily} प्रतिदिन, ₹${p.monthly} प्रति माह। शिफ्ट टाइम पर गेट डिलीवरी।`
          : `Home-style tiffin delivered daily to factories and companies in ${name} — ₹${p.daily} daily, ₹${p.monthly} monthly. Gate delivery by shift time.`}
      </p>
      {a.companies.length > 0 && (
        <p className="mt-4 text-sm text-ink/60">
          {lang === "hi" ? "यहाँ डिलीवरी हो रही है:" : "Already delivering to:"} {a.companies.slice(0, 8).map((c) => c.name).join(", ")}
        </p>
      )}
      <Link href={`/order?area=${a.slug}`} className="btn-primary mt-6">{t.nav.order} →</Link>
      <div className="mt-10"><PlanCards t={t} p={p} cutoff={s.orderCutoff} whatsapp={s.whatsappNumber} /></div>
    </div>
  );
}
