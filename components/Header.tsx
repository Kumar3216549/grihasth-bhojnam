import Link from "next/link";
import { Logo } from "./Logo";
import LangToggle from "./LangToggle";
import type { Dict, Lang } from "@/lib/i18n";
import MobileNav from "./MobileNav";

export default function Header({ lang, t }: { lang: Lang; t: Dict }) {
  const links = [
    { href: "/menu", label: t.nav.menu },
    { href: "/plans", label: t.nav.plans },
    { href: "/#contact", label: t.nav.contact },
  ];
  return (
    <header className="sticky top-0 z-40 bg-cream/80 shadow-[0_8px_30px_-20px_rgba(36,11,17,.4)] backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link href="/" aria-label={t.brand}><Logo lang={lang} /></Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="relative text-sm font-medium text-ink/80 transition after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold-500 after:transition-all hover:text-gold-700 hover:after:w-full">{l.label}</Link>
          ))}
          <LangToggle lang={lang} label={t.langToggle} aria={t.a11y.lang} />
          <Link href="/thali" className="btn-primary !py-2">{t.quick.cta}</Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <LangToggle lang={lang} label={t.langToggle} aria={t.a11y.lang} />
          <MobileNav openLabel={t.a11y.openMenu} closeLabel={t.a11y.closeMenu} links={[{ href: "/", label: t.nav.home }, ...links, { href: "/thali", label: t.quick.cta }, { href: "/order", label: t.nav.order }]} />
        </div>
      </div>
      <div className="gold-line" aria-hidden />
    </header>
  );
}
