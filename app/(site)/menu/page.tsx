import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { getSettings, paneerDayList, prices } from "@/lib/settings";
import { getMenu } from "@/lib/menu";
import { dishCards } from "@/lib/menuView";
import { todayDb, fmtDate } from "@/lib/dates";
import FlipImage from "@/components/FlipImage";
import IncludedItems from "@/components/IncludedItems";
import { Divider } from "@/components/Ornament";
import WeeklyMenu from "@/components/WeeklyMenu";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Today's Menu — Veg Thali ₹87",
  description: "Laziz weekly menu: aloo gobhi, mix veg, paneer butter masala, rajma, chhole, matar paneer with dal, 4 tawa roti, rice and salad. With 2 packets of mukhwas and 2 tissue papers.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const today = await getMenu(todayDb(), paneerDayList(s), s.riceType);
  const dishes = dishCards(lang, t, today);
  const sizes = "(min-width:1024px) 20vw, (min-width:640px) 50vw, 100vw";

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="relative text-center">
        <div className="mandala-bg pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-10" aria-hidden />
        <p className="chip relative mx-auto bg-saffron-50 text-saffron-800 ring-1 ring-saffron-200">{t.menu.today} · {fmtDate(today.date, lang)}</p>
        <h1 className="relative mt-3 text-3xl font-extrabold text-earth-800 sm:text-4xl">{t.menu.title}</h1>
        <Divider className="relative mt-3" />
        {today.closed && <p className="relative mt-3 text-lg font-semibold text-saffron-700">{t.menu.sunday}</p>}
      </header>

      <h2 className="mt-10 text-lg font-bold text-earth-800">{t.menu.fixed}</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {dishes.map((d) => (
          <article key={d.key} className="card-luxe overflow-hidden">
            <div className="relative aspect-[4/3]">
              {d.flip ? (
                <FlipImage sizes={sizes} slides={[d.flip[0], d.flip[1]]} />
              ) : (
                <Image src={d.img} alt={d.alt} fill sizes={sizes} className="object-cover" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-earth-800">{d.title}</h3>
              <p className="mt-1 text-sm text-ink/65">{d.desc}</p>
              {d.today && <p className="chip mt-2 bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200">{d.today}</p>}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10"><WeeklyMenu lang={lang} t={t} todayWd={today.date.getUTCDay()} /></div>

      <div className="mt-8"><IncludedItems lang={lang} t={t} /></div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 royal-bg rounded-3xl p-6 text-white shadow-luxe ring-1 ring-gold-400/30 sm:flex-row">
        <p className="text-gold text-lg font-bold">
          {t.menu.thali} ₹{p.daily}
          {today.isPaneer && <> · {t.menu.paneerThali} ₹{p.paneer}</>}
          {" · "}{t.menu.monthly} ₹{p.monthly.toLocaleString("en-IN")}
        </p>
        <Link href="/thali" className="btn-gold">{t.quick.cta}</Link>
      </div>
    </div>
  );
}
