import Image from "next/image";
import Link from "next/link";
import PlanCards from "@/components/PlanCards";
import { getDict } from "@/lib/lang";
import { getSettings, paneerDayList, prices } from "@/lib/settings";
import { IMAGES } from "@/lib/images";
import { SLOGAN } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getMenu } from "@/lib/menu";
import { todayDb } from "@/lib/dates";

export const dynamic = "force-dynamic";

async function getAreas() {
  try {
    return await db.area.findMany({ where: { active: true }, orderBy: { routeSeq: "asc" } });
  } catch {
    return [];
  }
}

export default async function Home() {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const [areas, menu] = await Promise.all([getAreas(), getMenu(todayDb(), paneerDayList(s))]);
  const thaliIcons = ["🫓", "🍚", "🥣", "🥘", "🥗"];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="tiffin-pattern absolute inset-0 opacity-60" aria-hidden />
        <div className="container-x relative grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <span className="chip bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200">
              <span className="h-2 w-2 rounded-full bg-leaf-500" /> {t.hero.kicker}
            </span>

            {/* Slogan — always shown in both languages */}
            <h1 className="mt-5">
              <span className="block font-hindi text-4xl font-bold leading-[1.25] text-saffron-700 sm:text-5xl lg:text-[3.4rem]">
                {SLOGAN.hi}
              </span>
              <span className="mt-3 block text-lg font-semibold text-leaf-700 sm:text-xl">{SLOGAN.en}</span>
            </h1>

            <p className="mt-6 text-xl font-semibold text-ink sm:text-2xl">{t.hero.title}</p>
            <p className="mt-3 max-w-xl text-base text-ink/70">{t.hero.sub}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/order" className="btn-primary px-7 py-3.5 text-base">{t.hero.ctaOrder} →</Link>
              <Link href="/plans" className="btn-ghost px-7 py-3.5 text-base">{t.hero.ctaPlans}</Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink/80">
              <li className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-sm border-2 border-leaf-600"><span className="h-2 w-2 rounded-full bg-leaf-600" /></span>{t.hero.trust1}</li>
              <li>⏰ {t.hero.trust2}</li>
              <li>💵 {t.hero.trust3}</li>
            </ul>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl ring-8 ring-white">
              <Image src={IMAGES.heroWorkers} alt="Workers having lunch together from steel thalis" fill priority sizes="(min-width:1024px) 560px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
            </div>
            {/* thali card */}
            <div className="absolute -bottom-6 -left-2 flex w-60 items-center gap-3 rounded-2xl bg-white p-3 shadow-xl sm:-left-8 sm:w-72">
              <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <Image src={IMAGES.thaliRoti} alt="Veg thali" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink/60">{lang === "hi" ? "वेज थाली" : "Veg Thali"}</p>
                <p className="text-2xl font-extrabold text-saffron-600">₹{p.daily}</p>
                <p className="text-[11px] text-ink/60">{lang === "hi" ? "मंथली" : "Monthly"} ₹{p.monthly}</p>
              </div>
            </div>
            {/* delivered card */}
            <div className="absolute -top-4 right-3 rounded-2xl bg-leaf-600 px-4 py-2.5 text-white shadow-xl sm:-right-4">
              <p className="text-[11px] opacity-90">{lang === "hi" ? "गेट पर पहुँचा" : "Delivered at gate"}</p>
              <p className="text-sm font-bold">✓ 12:25 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* THALI */}
      <section className="container-x mt-16 sm:mt-20">
        <div className="card grid overflow-hidden md:grid-cols-2">
          <div className="relative min-h-[280px]">
            <Image src={IMAGES.thaliTop} alt="Ghar ki thali" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="p-6 sm:p-10">
            <h2 className="h-section">{t.thali.title}</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {t.thali.items.map((it, i) => (
                <li key={it} className="flex items-center gap-3 rounded-xl bg-saffron-50 px-3 py-3 text-sm font-semibold">
                  <span className="text-2xl" aria-hidden>{thaliIcons[i]}</span>{it}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-ink/70">{t.thali.note}</p>
            <div className="mt-5 rounded-xl border border-dashed border-saffron-300 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-saffron-700">{t.menu.today}</p>
              <p className="mt-1 text-lg font-bold">
                {menu.closed ? t.menu.sunday : lang === "hi" ? menu.sabjiHi : menu.sabjiEn}
                {menu.isPaneer && !menu.closed && <span className="chip ml-2 bg-saffron-500 text-white">{t.menu.paneerDay}</span>}
              </p>
              <Link href="/menu" className="mt-2 inline-block text-sm font-semibold text-leaf-700 hover:underline">{t.menu.week} →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="container-x mt-20">
        <div className="mb-8 text-center">
          <h2 className="h-section">{t.plans.title}</h2>
          <p className="mt-2 text-ink/70">{t.plans.sub}</p>
        </div>
        <PlanCards t={t} p={p} cutoff={s.orderCutoff} whatsapp={s.whatsappNumber} />
      </section>

      {/* HOW */}
      <section className="container-x mt-20">
        <h2 className="h-section text-center">{t.how.title}</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {t.how.steps.map((st, i) => (
            <li key={st.t} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-500 text-lg font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold">{st.t}</h3>
              <p className="mt-1 text-sm text-ink/70">{st.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PHOTO STRIP */}
      <section className="container-x mt-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [IMAGES.rotiTawa, lang === "hi" ? "तवे पर फूली रोटी" : "Tawa roti, fresh"],
            [IMAGES.kitchen, lang === "hi" ? "रोज़ सुबह ताज़ा" : "Fresh every morning"],
            [IMAGES.steelTiffin, lang === "hi" ? "स्टील टिफ़िन" : "Steel tiffin"],
            [IMAGES.workersLunch, lang === "hi" ? "घर जैसी थाली" : "Ghar jaisi thali"],
          ].map(([src, cap]) => (
            <figure key={src} className="relative aspect-square overflow-hidden rounded-2xl">
              <Image src={src} alt={cap} fill sizes="(min-width:640px) 25vw, 50vw" className="object-cover transition duration-500 hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-semibold text-white">{cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="container-x mt-20">
        <h2 className="h-section text-center">{t.why.title}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.items.map((w, i) => (
            <div key={w.t} className="card p-6">
              <span className="text-3xl" aria-hidden>{["💰", "🏠", "⏱️", "🧼"][i]}</span>
              <h3 className="mt-3 font-bold">{w.t}</h3>
              <p className="mt-1 text-sm text-ink/70">{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AREAS */}
      {areas.length > 0 && (
        <section className="container-x mt-20">
          <h2 className="h-section text-center">{t.areas.title}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {areas.map((a) => (
              <Link key={a.id} href={`/tiffin-service/${a.slug}`} className="rounded-full border border-saffron-200 bg-white px-4 py-2 text-sm font-medium hover:border-saffron-400 hover:text-saffron-700">
                📍 {lang === "hi" ? a.nameHi : a.nameEn}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center text-sm">
            <a href={`https://wa.me/${s.whatsappNumber}`} className="font-semibold text-leaf-700 hover:underline">{t.areas.cta}</a>
          </p>
        </section>
      )}

      {/* CTA BAND */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-leaf-700 px-6 py-12 text-center text-white sm:px-12">
          <div className="tiffin-pattern absolute inset-0 opacity-20" aria-hidden />
          <p className="relative font-hindi text-2xl font-bold sm:text-4xl">{SLOGAN.hi}</p>
          <p className="relative mt-2 text-white/85">{SLOGAN.en}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/order" className="btn bg-saffron-500 px-7 py-3.5 text-base text-white hover:bg-saffron-600">{t.hero.ctaOrder}</Link>
            <Link href="/plans" className="btn bg-white px-7 py-3.5 text-base text-leaf-800 hover:bg-leaf-50">{t.plans.subscribe}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
