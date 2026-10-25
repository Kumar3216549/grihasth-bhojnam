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
    <header className="sticky top-0 z-40 border-b border-earth-100 bg-cream/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link href="/" aria-label={t.brand}><Logo lang={lang} /></Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-ink/80 hover:text-saffron-700">{l.label}</Link>
          ))}
          <LangToggle lang={lang} label={t.langToggle} aria={t.a11y.lang} />
          <Link href="/order" className="btn-primary !py-2">{t.nav.order}</Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <LangToggle lang={lang} label={t.langToggle} aria={t.a11y.lang} />
          <MobileNav openLabel={t.a11y.openMenu} closeLabel={t.a11y.closeMenu} links={[{ href: "/", label: t.nav.home }, ...links, { href: "/order", label: t.nav.order }]} />
        </div>
      </div>
    </header>
  );
}
