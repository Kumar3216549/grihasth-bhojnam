import Link from "next/link";
import { Logo } from "./Logo";
import { SLOGAN, type Dict, type Lang } from "@/lib/i18n";
import type { Settings } from "@/lib/settings";

export default function Footer({ lang, t, s }: { lang: Lang; t: Dict; s: Settings }) {
  return (
    <footer className="mt-20 border-t border-saffron-100 bg-white">
      <div className="container-x grid gap-10 py-12 md:grid-cols-3">
        <div>
          <Logo lang={lang} />
          <p className="mt-4 max-w-xs text-sm text-ink/70">{t.footer.about}</p>
          <p className="mt-4 font-hindi text-sm font-semibold text-saffron-700">{SLOGAN.hi}</p>
          <p className="text-xs text-leaf-700">{SLOGAN.en}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/60">{t.footer.links}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/menu" className="hover:text-saffron-700">{t.nav.menu}</Link></li>
            <li><Link href="/plans" className="hover:text-saffron-700">{t.nav.plans}</Link></li>
            <li><Link href="/order" className="hover:text-saffron-700">{t.nav.order}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/60">{t.footer.contact}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={`tel:${s.businessPhone.replace(/\s/g, "")}`} className="hover:text-saffron-700">📞 {s.businessPhone}</a></li>
            <li><a href={`https://wa.me/${s.whatsappNumber}`} className="hover:text-saffron-700">💬 WhatsApp</a></li>
            <li className="text-ink/70">📍 {s.kitchenAddress}</li>
            {s.fssaiNo && <li className="text-ink/70">{t.footer.fssai} {s.fssaiNo}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-saffron-50 py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Grihasth Bhojnam by Sachin. {t.footer.rights}
      </div>
    </footer>
  );
}
