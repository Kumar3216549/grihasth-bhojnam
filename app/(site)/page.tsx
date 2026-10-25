import Image from "next/image";
import Link from "next/link";
import PlanCards from "@/components/PlanCards";
import IncludedItems from "@/components/IncludedItems";
import ContactSection from "@/components/ContactSection";
import FeedbackForm from "@/components/FeedbackForm";
import { Divider, Lotus, SectionTitle } from "@/components/Ornament";
import { getDict } from "@/lib/lang";
import { getSettings, paneerDayList, prices } from "@/lib/settings";
import { IMAGES } from "@/lib/images";
import { SHLOKA, SLOGAN } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getMenu } from "@/lib/menu";
import { dishCards } from "@/lib/menuView";
import { fmtDate, todayDb } from "@/lib/dates";

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
  const [areas, menu] = await Promise.all([getAreas(), getMenu(todayDb(), paneerDayList(s), s.riceType)]);
  const dishes = dishCards(lang, t, menu);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="tiffin-pattern absolute inset-0 opacity-50" aria-hidden />
        <div className="mandala-bg pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] opacity-[0.12]" aria-hidden />
        <div className="container-x relative grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          <div>
            <span className="chip bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200">
              <span className="h-2 w-2 rounded-full bg-leaf-500" /> {t.hero.kicker}
            </span>

            {/* Slogan — always shown in both languages (it is the brand line) */}
            <h1 className="mt-5">
              <span className="block font-hindi text-4xl font-bold leading-[1.25] text-saffron-700 sm:text-5xl lg:text-[3.3rem]">{SLOGAN.hi}</span>
              <span className="mt-3 block text-lg font-semibold italic text-leaf-700 sm:text-xl">{SLOGAN.en}</span>
            </h1>

            <p className="mt-6 text-xl font-bold text-earth-800 sm:text-2xl">{t.hero.title}</p>
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
            <div className="relative aspect-[1002/540] overflow-hidden rounded-[2rem] shadow-2xl ring-8 ring-white">
              <Image src={IMAGES.hero} alt={t.hero.imgAlt} fill priority sizes="(min-width:1024px) 600px, 100vw" className="object-cover" />
            </div>
            {/* thali price card */}
            <div className="absolute -bottom-8 -left-2 flex w-60 items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-earth-100 sm:-left-8 sm:w-72">
              <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <Image src={IMAGES.promoThali} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink/60">{t.hero.vegThali}</p>
                <p className="text-2xl font-extrabold text-saffron-600">₹{p.daily}</p>
                <p className="text-[11px] text-ink/60">{t.hero.monthly} ₹{p.monthly.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="absolute -top-4 right-3 rounded-2xl bg-leaf-600 px-4 py-2.5 text-white shadow-xl sm:-right-4">
              <p className="text-[11px] opacity-90">{t.hero.delivered}</p>
              <p className="text-sm font-bold">✓ 12:25 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* SHLOKA BAND */}
      <section className="mt-16 sm:mt-20" aria-label={t.shlokaMeaning}>
        <div className="toran" aria-hidden />
        <div className="relative overflow-hidden bg-earth-800 py-8 text-center text-earth-50">
          <div className="mandala-bg pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 opacity-10" aria-hidden />
          <p lang="sa" className="relative font-hindi text-2xl font-bold tracking-wide text-saffron-200 sm:text-3xl">{SHLOKA}</p>
          <p className="relative mt-2 text-sm italic text-earth-100/90">{t.shlokaMeaning}</p>
        </div>
      </section>

      {/* THALI — exactly five fixed categories */}
      <section className="container-x mt-16 sm:mt-20">
        <SectionTitle title={t.thali.title} sub={t.thali.note} />
        <p className="mt-2 text-center text-sm font-semibold text-saffron-700">
          {t.menu.today} · {fmtDate(menu.date, lang)}{menu.closed ? ` — ${t.menu.sunday}` : ""}
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {dishes.map((d) => (
            <li key={d.key} className="card overflow-hidden text-center">
              <div className="relative aspect-square">
                <Image src={d.img} alt={d.alt} fill sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw" className="object-cover" />
              </div>
              <div className="p-3">
                <p className="font-bold text-earth-800">{d.title}</p>
                {d.today && <p className="mt-1 text-xs font-semibold text-leaf-700">{d.today}</p>}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col items-center gap-3">
          <IncludedItems lang={lang} t={t} compact />
          <Link href="/menu" className="text-sm font-semibold text-leaf-700 hover:underline">{t.nav.menu} →</Link>
        </div>
      </section>

      {/* INCLUDED: mukhwas + tissue */}
      <section className="container-x mt-12">
        <IncludedItems lang={lang} t={t} />
      </section>

      {/* PLANS */}
      <section id="plans" className="container-x mt-20">
        <div className="mb-8"><SectionTitle title={t.plans.title} sub={t.plans.sub} /></div>
        <PlanCards t={t} p={p} cutoff={s.orderCutoff} whatsapp={s.whatsappNumber} />
      </section>

      {/* HOW */}
      <section className="container-x mt-20">
        <SectionTitle title={t.how.title} />
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {t.how.steps.map((st, i) => (
            <li key={st.t} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-500 text-lg font-bold text-white ring-4 ring-saffron-100">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-earth-800">{st.t}</h3>
              <p className="mt-1 text-sm text-ink/70">{st.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PHOTO STRIP — four separate images */}
      <section className="container-x mt-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [IMAGES.promoRoti, t.photos.roti],
            [IMAGES.promoRice, t.photos.rice],
            [IMAGES.promoPacking, t.photos.packing],
            [IMAGES.promoThali, t.photos.thali],
          ].map(([src, cap]) => (
            <figure key={src} className="relative aspect-[6/5] overflow-hidden rounded-2xl ring-1 ring-earth-100">
              <Image src={src} alt={cap} fill sizes="(min-width:640px) 25vw, 50vw" className="object-cover transition duration-500 hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-sm font-semibold text-white">{cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="container-x mt-20">
        <SectionTitle title={t.why.title} />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.items.map((w, i) => (
            <div key={w.t} className="card p-6">
              <span className="text-3xl" aria-hidden>{["💰", "🏠", "⏱️", "🧼"][i]}</span>
              <h3 className="mt-3 font-bold text-earth-800">{w.t}</h3>
              <p className="mt-1 text-sm text-ink/70">{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AREAS */}
      {areas.length > 0 && (
        <section className="container-x mt-20">
          <SectionTitle title={t.areas.title} />
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

      {/* CONTACT + FEEDBACK */}
      <section id="contact" className="container-x mt-20 scroll-mt-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactSection t={t} s={s} />
          <div id="feedback" className="scroll-mt-24"><FeedbackForm t={t.feedback} lang={lang} /></div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-leaf-700 px-6 py-12 text-center text-white sm:px-12">
          <div className="mandala-bg pointer-events-none absolute -left-20 -top-20 h-72 w-72 opacity-15" aria-hidden />
          <div className="mandala-bg pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 opacity-15" aria-hidden />
          <Lotus className="relative mx-auto h-8 w-12" />
          <p className="relative mt-3 font-hindi text-2xl font-bold sm:text-4xl">{SLOGAN.hi}</p>
          <p className="relative mt-2 italic text-white/85">{SLOGAN.en}</p>
          <Divider className="relative mt-4 opacity-80" />
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/order" className="btn bg-saffron-500 px-7 py-3.5 text-base text-white hover:bg-saffron-600">{t.hero.ctaOrder}</Link>
            <Link href="/plans" className="btn bg-white px-7 py-3.5 text-base text-leaf-800 hover:bg-leaf-50">{t.plans.subscribe}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
