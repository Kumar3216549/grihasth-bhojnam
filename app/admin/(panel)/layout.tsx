import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import AdminNav from "./AdminNav";
import { ymdIST, fmtDate, todayDb } from "@/lib/dates";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 lg:flex">
      <AdminNav today={ymdIST()} />
      <div className="flex-1 lg:pl-60">
        <header className="sticky top-0 z-20 hidden h-14 items-center justify-between border-b border-stone-200 bg-white/90 px-6 backdrop-blur lg:flex">
          <p className="text-sm text-stone-500">📅 {fmtDate(todayDb())}</p>
          <p className="font-hindi text-sm font-semibold text-saffron-700">व्यापार नहीं, व्यवहार परोसते हैं हम।</p>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
