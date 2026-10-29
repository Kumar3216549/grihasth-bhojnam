import Image from "next/image";
import Link from "next/link";
import PlanCards from "@/components/PlanCards";
import IncludedItems from "@/components/IncludedItems";
import ContactSection from "@/components/ContactSection";
import FeedbackForm from "@/components/FeedbackForm";
import { Divider, Lotus, SectionTitle } from "@/components/Ornament";
import WeeklyMenu from "@/components/WeeklyMenu";
import { getDict } from "@/lib/lang";
import { getSettings, paneerDayList, prices } from "@/lib/settings";
import { IMAGES } from "@/lib/images";
import { SHLOKA, SLOGAN } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getMenu, WEEK_DISHES } from "@/lib/menu";
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
      {/* HERO — royal night with antique gold */}
      <section className="royal-bg relative overflow-hidden text-white">
        <div className="mandala-bg pointer-events-none absolute -right-48 -top-48 h-[42rem] w-[42rem] animate-spinslow opacity-[0.10]" aria-hidden />
        <div className="mandala-bg pointer-events-none absolute -bottom-56 -left-56 h-[36rem] w-[36rem] animate-spinslow opacity-[0.06]" aria-hidden />
        <div className="container-x relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-leaf-400 shadow-[0_0_10px_2px_rgba(74,222,128,.6)]" /> {t.hero.kicker}
            </span>

            {/* Slogan — always shown in both languages (it is the brand line) */}
            <h1 className="mt-6">
              <span className="text-gold block font-hindi text-4xl font-bold leading-[1.3] sm:text-5xl lg:text-[3.5rem]">{SLOGAN.hi}</span>
              <span className="mt-3 block text-lg font-light italic text-gold-100/90 sm:text-xl">{SLOGAN.en}</span>
            </h1>
            <div className="gold-line mt-6 max-w-md" aria-hidden />

            <p className="mt-6 text-xl font-bold text-white sm:text-2xl">{t.hero.title}</p>
            <p className="mt-3 max-w-xl text-base text-white/70">{t.hero.sub}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/thali" className="btn-gold px-7 py-3.5 text-base">🍽️ {t.quick.cta} →</Link>
              <Link href="/plans" className="btn-glass px-7 py-3.5 text-base">{t.hero.ctaPlans}</Link>
            </div>

            <ul className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-center">
              {[
                [`₹${p.daily}`, lang === "hi" ? "प्रति थाली" : "per thali"],
                [lang === "hi" ? "सोम–शनि" : "Mon–Sat", lang === "hi" ? "रोज़ ताज़ा" : "cooked fresh"],
                [lang === "hi" ? "100% शुद्ध" : "100% pure", lang === "hi" ? "शाकाहारी" : "vegetarian"],
              ].map(([a, b]) => (
                <li key={b} className="glass px-2 py-3">
                  <p className="text-gold text-lg font-extrabold sm:text-xl">{a}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/60">{b}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative animate-rise [animation-delay:.15s]">
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gold-400/20 blur-3xl" aria-hidden />
            <div className="gold-frame relative shadow-luxe">
              <div className="relative aspect-[1002/540] overflow-hidden rounded-[2rem]">
                <Image src={IMAGES.hero} alt={t.hero.imgAlt} fill priority sizes="(min-width:1024px) 600px, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-royal-950/40 via-transparent to-transparent" aria-hidden />
              </div>
            </div>
            {/* thali price card */}
            <div className="absolute -bottom-10 -left-2 flex w-64 animate-floaty items-center gap-3 rounded-2xl border border-gold-200/60 bg-white/95 p-3 text-ink shadow-luxe backdrop-blur sm:-left-8 sm:w-72">
              <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl ring-2 ring-gold-300 sm:h-20 sm:w-20">
                <Image src={IMAGES.promoThali} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink/60">{t.hero.vegThali}</p>
                <p className="text-gold-deep text-3xl font-extrabold">₹{p.daily}</p>
                <p className="text-[11px] text-ink/60">{t.hero.monthly} ₹{p.monthly.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="absolute -top-5 right-3 animate-floaty rounded-2xl border border-gold-300/50 bg-royal-900/80 px-4 py-2.5 text-white shadow-luxe backdrop-blur [animation-delay:1.5s] sm:-right-4">
              <p className="text-[11px] text-gold-200">{t.hero.delivered}</p>
              <p className="text-sm font-bold">✓ 12:25 PM</p>
            </div>
          </div>
        </div>
        <div className="gold-line" aria-hidden />
      </section>

      {/* DISH RIBBON — slow auto-scroll of the week's dishes */}
      <section className="royal-bg overflow-hidden border-b border-gold-500/20 py-6" aria-label={t.nav.menu}>
        <div className="fade-x">
          <ul className="marquee flex w-max animate-marquee gap-4">
            {[...Object.values(WEEK_DISHES), ...Object.values(WEEK_DISHES)].map((d, i) => (
              <li key={i} className="flex flex-none items-center gap-3 rounded-full border border-gold-300/25 bg-white/5 py-1.5 pl-1.5 pr-5 backdrop-blur" aria-hidden={i >= Object.keys(WEEK_DISHES).length}>
                <span className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-gold-300/60">
                  <Image src={d.img} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="whitespace-nowrap text-sm font-semibold text-gold-100">{lang === "hi" ? d.hi : d.en}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SHLOKA */}
      <section className="mt-16 sm:mt-20" aria-label={t.shlokaMeaning}>
        <div className="container-x text-center">
          <Lotus className="mx-auto h-8 w-12" />
          <p lang="sa" className="text-gold-deep mt-3 font-hindi text-2xl font-bold tracking-wide sm:text-3xl">{SHLOKA}</p>
          <p className="mt-2 text-sm italic text-ink/60">{t.shlokaMeaning}</p>
          <Divider className="mt-4" />
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
            <li key={d.key} className="card-luxe group overflow-hidden text-center">
              <div className="relative aspect-square overflow-hidden">
                <Image src={d.img} alt={d.alt} fill sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-110" />
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

      {/* LAZIZ WEEKLY MENU */}
      <section className="container-x mt-12">
        <WeeklyMenu lang={lang} t={t} todayWd={menu.date.getUTCDay()} compact />
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
            <li key={st.t} className="card-luxe relative overflow-hidden p-7">
              <span className="text-gold-deep pointer-events-none absolute -right-2 -top-6 font-serif text-8xl font-black opacity-15" aria-hidden>{i + 1}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 font-serif text-lg font-bold text-royal-900 shadow-gold">{i + 1}</span>
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
            <figure key={src} className="group relative aspect-[6/5] overflow-hidden rounded-3xl shadow-card ring-1 ring-gold-200/70">
              <Image src={src} alt={cap} fill sizes="(min-width:640px) 25vw, 50vw" className="object-cover transition duration-700 group-hover:scale-110" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-royal-950/85 to-transparent p-4 text-sm font-semibold text-gold-100">{cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="container-x mt-20">
        <SectionTitle title={t.why.title} />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.items.map((w, i) => (
            <div key={w.t} className="card-luxe p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-100 to-saffron-100 text-3xl ring-1 ring-gold-200" aria-hidden>{["💰", "🏠", "⏱️", "🧼"][i]}</span>
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
              <Link key={a.id} href={`/tiffin-service/${a.slug}`} className="rounded-full border border-gold-300/70 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-gold-500 hover:text-gold-700 hover:shadow-gold">
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
        <div className="royal-bg relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white shadow-luxe ring-1 ring-gold-400/30 sm:px-12">
          <div className="mandala-bg pointer-events-none absolute -left-20 -top-20 h-72 w-72 opacity-15" aria-hidden />
          <div className="mandala-bg pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 opacity-15" aria-hidden />
          <Lotus className="relative mx-auto h-8 w-12" />
          <p className="text-gold relative mt-3 font-hindi text-3xl font-bold leading-snug sm:text-5xl">{SLOGAN.hi}</p>
          <p className="relative mt-2 italic text-gold-100/80">{SLOGAN.en}</p>
          <Divider className="relative mt-4 opacity-80" />
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/thali" className="btn-gold px-7 py-3.5 text-base">{t.quick.cta}</Link>
            <Link href="/plans" className="btn-glass px-7 py-3.5 text-base">{t.plans.subscribe}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
