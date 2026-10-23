import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { getSettings, paneerDayList, prices } from "@/lib/settings";
import { getWeekMenu } from "@/lib/menu";
import { todayDb, fmtDate } from "@/lib/dates";
import { IMAGES, IMAGES_ZOOM } from "@/lib/images";
import FlipImage from "@/components/FlipImage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Today's Menu — Veg Thali ₹60",
  description: "Aaj ka menu: 4 tawa roti, rice, dal fry, mix veg / paneer sabji, salad. Factory tiffin delivery, weekly sabji rotation.",
  alternates: { canonical: "/menu" },
};

const mixVegSlide = (lang: "hi" | "en") => ({ src: IMAGES.mixVeg, alt: "Mix veg sabji with peas, carrot and cauliflower", label: lang === "hi" ? "मिक्स वेज" : "Mix Veg" });
const paneerSlide = (lang: "hi" | "en") => ({ src: IMAGES.paneer, alt: "Paneer butter masala with soft paneer cubes", label: lang === "hi" ? "⭐ पनीर स्पेशल" : "⭐ Paneer Special", zoom: IMAGES_ZOOM.paneer.zoom, origin: IMAGES_ZOOM.paneer.origin });

export default async function MenuPage() {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const week = await getWeekMenu(todayDb(), paneerDayList(s));
  const today = week[0];
  const dishes = [
    { img: IMAGES.rotiTawa, en: "4 Tawa Roti", hi: "4 तवा रोटी", dEn: "Fresh atta, made on tawa, soft & phuli hui", dHi: "ताज़ा आटा, तवे पर बनी, नरम और फूली हुई" },
    { img: IMAGES.rice, en: "Rice", hi: "चावल", dEn: "Steamed / jeera rice", dHi: "सादा / जीरा चावल" },
    { img: IMAGES.dal, en: "Dal Fry", hi: "दाल फ्राई", dEn: "Arhar-moong dal with ghee tadka", dHi: "अरहर-मूंग दाल, घी का तड़का" },
    {
      img: IMAGES.mixVeg,
      flip: true,
      en: "Mix Veg / Paneer Sabji",
      hi: "मिक्स वेज / पनीर सब्ज़ी",
      dEn: "Mix veg daily, Paneer Special twice a week",
      dHi: "रोज़ मिक्स वेज, हफ़्ते में दो बार पनीर स्पेशल",
    },
    { img: IMAGES.salad, en: "Salad", hi: "सलाद", dEn: "Onion, cucumber, carrot, lemon", dHi: "प्याज़, खीरा, गाजर, नींबू" },
  ];

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="text-center">
        <p className="chip mx-auto bg-saffron-50 text-saffron-800">{fmtDate(today.date, lang)}</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{t.menu.title}</h1>
        <p className="mt-3 text-xl font-semibold text-saffron-700">
          {today.closed ? t.menu.sunday : lang === "hi" ? today.sabjiHi : today.sabjiEn}
        </p>
        {today.isPaneer && !today.closed && <p className="chip mx-auto mt-2 bg-saffron-500 text-white">⭐ {t.menu.paneerDay}</p>}
      </header>

      <h2 className="mt-12 text-lg font-bold">{t.menu.fixed}</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {dishes.map((d) => (
          <article key={d.en} className="card overflow-hidden">
            <div className="relative aspect-[4/3]">
              {"flip" in d ? (
                <FlipImage
                  sizes="(min-width:1024px) 20vw, (min-width:640px) 50vw, 100vw"
                  slides={
                    today.isPaneer
                      ? [paneerSlide(lang), mixVegSlide(lang)]
                      : [mixVegSlide(lang), paneerSlide(lang)]
                  }
                />
              ) : (
                <Image src={d.img} alt={d.en} fill sizes="(min-width:1024px) 20vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold">{lang === "hi" ? d.hi : d.en}</h3>
              <p className="mt-1 text-sm text-ink/65">{lang === "hi" ? d.dHi : d.dEn}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-saffron-500 p-6 text-white sm:flex-row">
        <p className="text-lg font-bold">
          {lang === "hi" ? "वेज थाली" : "Veg Thali"} ₹{p.daily} · {lang === "hi" ? "पनीर स्पेशल" : "Paneer Special"} ₹{p.paneer} · {lang === "hi" ? "मंथली" : "Monthly"} ₹{p.monthly}
        </p>
        <Link href="/order" className="btn bg-white text-saffron-700 hover:bg-saffron-50">{t.nav.order}</Link>
      </div>

      <h2 className="mt-14 text-lg font-bold">{t.menu.week}</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-saffron-100 bg-white">
        {week.map((d, i) => (
          <div key={i} className={`flex items-center justify-between gap-4 px-5 py-4 ${i ? "border-t border-saffron-50" : "bg-saffron-50/60"}`}>
            <div>
              <p className="text-sm font-semibold">
                {new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", timeZone: "UTC" }).format(d.date)}
                {i === 0 && <span className="ml-2 text-xs text-saffron-700">({t.menu.today})</span>}
              </p>
              <p className="text-xs text-ink/50">{fmtDate(d.date, lang)}</p>
            </div>
            <p className={`text-right text-sm font-medium ${d.closed ? "text-ink/40" : ""}`}>
              {d.closed ? t.menu.sunday : lang === "hi" ? d.sabjiHi : d.sabjiEn}
              {d.isPaneer && !d.closed && <span className="ml-2 chip bg-saffron-100 text-saffron-800">⭐ Paneer</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
