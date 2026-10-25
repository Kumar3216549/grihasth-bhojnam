"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", hi: "डैशबोर्ड", icon: "📊" },
  { href: "/admin/orders", label: "Today's Orders", hi: "आज के ऑर्डर", icon: "🧾" },
  { href: "/admin/kitchen", label: "Tiffin Calculator", hi: "टिफ़िन गिनती", icon: "🍱" },
  { href: "/admin/subscribers", label: "Monthly Subscribers", hi: "मंथली ग्राहक", icon: "👥" },
  { href: "/admin/inventory", label: "Inventory", hi: "स्टॉक", icon: "📦" },
  { href: "/admin/routes", label: "Delivery Routes", hi: "डिलीवरी रूट", icon: "🛵" },
  { href: "/admin/finance", label: "Profit & Loss", hi: "मुनाफ़ा / नुकसान", icon: "💰" },
  { href: "/admin/feedback", label: "Feedback", hi: "ग्राहकों की राय", icon: "💬" },
  { href: "/admin/settings", label: "Prices, Menu & UPI", hi: "दाम, मेन्यू और यूपीआई", icon: "⚙️" },
];

export default function AdminNav({ today }: { today: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2"><img src="/logo-mark.svg" className="h-8 w-8" alt="" /><span className="font-hindi font-bold text-saffron-700">गृहस्थ भोजनम्</span></Link>
        <button onClick={() => setOpen(!open)} className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm" aria-expanded={open}>☰ Menu</button>
      </div>
      <aside className={`${open ? "block" : "hidden"} fixed inset-y-0 left-0 z-40 w-60 overflow-y-auto border-r border-stone-200 bg-white lg:block`}>
        <div className="flex h-14 items-center gap-2 border-b border-stone-100 px-4">
          <img src="/logo-mark.svg" className="h-8 w-8" alt="" />
          <div className="leading-tight">
            <p className="font-hindi text-sm font-bold text-saffron-700">गृहस्थ भोजनम्</p>
            <p className="text-[10px] uppercase tracking-wider text-stone-500">Admin · Sachin</p>
          </div>
        </div>
        <nav className="space-y-0.5 p-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active(n.href) ? "bg-saffron-50 font-semibold text-saffron-800" : "text-stone-700 hover:bg-stone-50"}`}>
              <span className="text-base" aria-hidden>{n.icon}</span>
              <span className="leading-tight">{n.label}<span className="block font-hindi text-[11px] font-normal text-stone-400">{n.hi}</span></span>
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-stone-100 p-2 text-sm">
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-50">🌐 View website</Link>
          <a href={`/api/admin/orders.csv?date=${today}`} className="block rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-50">⬇️ Today&apos;s orders CSV</a>
          <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="block w-full rounded-lg px-3 py-2 text-left text-stone-600 hover:bg-stone-50">🚪 Sign out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
