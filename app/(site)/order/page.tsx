import type { Metadata } from "next";
import Image from "next/image";
import OrderForm from "./OrderForm";
import { getDict } from "@/lib/lang";
import { getSettings, paneerDayList, prices, shiftList, telHref, upiReady } from "@/lib/settings";
import { db } from "@/lib/db";
import { ymdIST, todayDb } from "@/lib/dates";
import { DISH, paneerDatesAhead } from "@/lib/menu";
import { includedItems } from "@/lib/menuView";
import { IMAGES } from "@/lib/images";
import { SLOGAN } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order Tiffin — UPI Prepaid or COD Pre-order",
  description: "Order daily tiffin (₹87) or monthly tiffin (₹2080) for your factory or company. Prepay by UPI or pre-book with cash on delivery.",
  alternates: { canonical: "/order" },
};

export default async function OrderPage({ searchParams }: { searchParams: { plan?: string; area?: string } }) {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  let areas: { slug: string; nameEn: string; nameHi: string }[] = [];
  try {
    areas = await db.area.findMany({ where: { active: true }, orderBy: { routeSeq: "asc" }, select: { slug: true, nameEn: true, nameHi: true } });
  } catch {}
  const L = (d: { en: string; hi: string }) => (lang === "hi" ? d.hi : d.en);

  return (
    <div className="container-x grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="text-3xl font-extrabold text-earth-800 sm:text-4xl">{t.order.title}</h1>
        <p className="mt-2 text-ink/70">{t.order.sub}</p>
        <OrderForm
          lang={lang}
          t={t.order}
          areas={areas}
          shifts={shiftList(s)}
          prices={{ daily: p.daily, paneer: p.paneer, monthly: p.monthly }}
          paneerDates={await paneerDatesAhead(todayDb(), 45, paneerDayList(s))}
          today={ymdIST()}
          defaultPlan={searchParams.plan === "MONTHLY" ? "MONTHLY" : "DAILY"}
          defaultArea={searchParams.area || ""}
          upiEnabled={upiReady(s)}
          whatsapp={s.whatsappNumber}
          menuItems={[DISH.roti, DISH.rice, DISH.dal, DISH.sabji, DISH.salad].map(L)}
          includedItems={includedItems(lang).map((i) => i.label)}
        />
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image src={IMAGES.promoThali} alt={t.photos.thali} fill sizes="380px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <p className="font-hindi text-xl font-bold">{SLOGAN.hi}</p>
              <p className="text-sm italic text-white/80">{SLOGAN.en}</p>
            </div>
          </div>
          <div className="card p-5 text-sm">
            <p className="font-semibold">⏰ {lang === "hi" ? `उसी दिन के लंच के लिए ${s.orderCutoff} तक ऑर्डर करें` : `Order by ${s.orderCutoff} for same-day lunch`}</p>
            <p className="mt-2"><a href={telHref(s.businessPhone)} className="text-ink/70 hover:text-saffron-700">📞 {s.businessPhone}</a></p>
            <p className="mt-1"><a href={`mailto:${s.email}`} className="break-all text-ink/70 hover:text-saffron-700">✉️ {s.email}</a></p>
          </div>
        </div>
      </aside>
    </div>
  );
}
