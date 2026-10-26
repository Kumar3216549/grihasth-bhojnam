import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QuickOrder from "./QuickOrder";
import { getDict } from "@/lib/lang";
import { getSettings, paneerDayList, prices, shiftList } from "@/lib/settings";
import { db } from "@/lib/db";
import { dishLabel, getMenu } from "@/lib/menu";
import { fmtDate, todayDb, ymdIST } from "@/lib/dates";
import { Divider } from "@/components/Ornament";
import { IMAGES } from "@/lib/images";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order Today's Thali",
  description: "Order today's veg thali in one minute and get a QR code to collect your meal.",
  alternates: { canonical: "/thali" },
};

export default async function ThaliPage() {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const menu = await getMenu(todayDb(), paneerDayList(s), s.riceType);
  let areas: { slug: string; nameEn: string; nameHi: string }[] = [];
  try {
    areas = await db.area.findMany({ where: { active: true }, orderBy: { routeSeq: "asc" }, select: { slug: true, nameEn: true, nameHi: true } });
  } catch {}
  const dish = dishLabel(menu, lang);
  const img = menu.dishes[0]?.img ?? IMAGES.promoThali;

  return (
    <div className="container-x max-w-xl py-8 sm:py-12">
      <h1 className="text-center text-3xl font-extrabold text-earth-800">{t.quick.title}</h1>
      <Divider className="mt-3" />
      <p className="mt-2 text-center text-sm font-semibold text-saffron-700">{fmtDate(menu.date, lang)}</p>

      {menu.closed ? (
        <div className="card mt-6 p-6 text-center">
          <p className="text-lg font-semibold text-leaf-800">🌿 {t.quick.closed}</p>
          <Link href="/order" className="btn-primary mt-4">{t.quick.preorder}</Link>
        </div>
      ) : (
        <>
          <div className="card mt-6 flex items-center gap-4 overflow-hidden p-3">
            <div className="relative h-24 w-24 flex-none overflow-hidden rounded-xl">
              <Image src={img} alt={dish} fill sizes="96px" className="object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{t.quick.todayDish}</p>
              <p className="text-lg font-bold text-earth-800">{dish}</p>
              <p className="text-sm text-ink/70">
                + {lang === "hi" ? "4 तवा रोटी, चावल, सलाद, 2 मुखवास, 2 टिश्यू" : "4 tawa roti, rice, salad, 2 mukhwas, 2 tissue"}
              </p>
              <p className="mt-1 text-xl font-extrabold text-saffron-600">₹{p.daily} <span className="text-xs font-medium text-ink/50">{t.quick.price}</span></p>
            </div>
          </div>
          <QuickOrder
            lang={lang}
            t={t.quick}
            errors={t.order.errors}
            price={p.daily}
            today={ymdIST()}
            shifts={shiftList(s)}
            areas={areas}
            whatsapp={s.whatsappNumber}
            dish={dish}
          />
        </>
      )}
    </div>
  );
}
