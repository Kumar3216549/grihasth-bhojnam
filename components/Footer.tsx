import Link from "next/link";
import { Logo } from "./Logo";
import { SLOGAN, type Dict, type Lang } from "@/lib/i18n";
import { telHref, type Settings } from "@/lib/settings";

export default function Footer({ lang, t, s }: { lang: Lang; t: Dict; s: Settings }) {
  return (
    <footer className="royal-bg mt-20 text-white/80">
      <div className="gold-line" aria-hidden />
      <div className="container-x grid gap-10 py-12 md:grid-cols-3">
        <div>
          <span className="inline-block rounded-2xl bg-cream px-3 py-2"><Logo lang={lang} /></span>
          <p className="mt-4 max-w-xs text-sm text-white/65">{t.footer.about}</p>
          <p className="mt-4 text-gold font-hindi text-base font-semibold">{SLOGAN.hi}</p>
          <p className="text-xs italic text-gold-100/70">{SLOGAN.en}</p>
        </div>
        <div>
          <h3 className="eyebrow-gold">{t.footer.links}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/menu" className="hover:text-gold-300">{t.nav.menu}</Link></li>
            <li><Link href="/plans" className="hover:text-gold-300">{t.nav.plans}</Link></li>
            <li><Link href="/order" className="hover:text-gold-300">{t.nav.order}</Link></li>
            <li><Link href="/#contact" className="hover:text-gold-300">{t.nav.contact}</Link></li>
            <li><Link href="/#feedback" className="hover:text-gold-300">{t.footer.feedback}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow-gold">{t.footer.contact}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={telHref(s.businessPhone)} className="hover:text-gold-300">📞 {s.businessPhone}</a></li>
            <li><a href={`mailto:${s.email}`} className="break-all hover:text-gold-300">✉️ {s.email}</a></li>
            <li><a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noopener" className="hover:text-gold-300">💬 {t.contact.whatsapp}</a></li>
            <li className="text-white/60">📍 {s.kitchenAddress}</li>
            {s.fssaiNo && <li className="text-white/60">{t.footer.fssai} {s.fssaiNo}</li>}
          </ul>
        </div>
      </div>
      <div className="gold-line opacity-60" aria-hidden />
      <div className="py-4 text-center text-xs text-white/45">
        © {new Date().getFullYear()} Grihasth Bhojnam by Sachin. {t.footer.rights}
      </div>
    </footer>
  );
}
