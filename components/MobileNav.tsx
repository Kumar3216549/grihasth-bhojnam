"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-ink" aria-label="Menu" aria-expanded={open}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-saffron-100 bg-cream shadow-lg">
          <nav className="container-x flex flex-col py-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-3 text-base font-medium ${path === l.href ? "bg-saffron-50 text-saffron-800" : "text-ink"}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
