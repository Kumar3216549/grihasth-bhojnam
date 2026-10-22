import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getDict } from "@/lib/lang";
import { fmt } from "@/lib/i18n";
import { fmtDate } from "@/lib/dates";
import { shiftTime, orderMessage } from "@/lib/whatsapp";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function Success({ params }: { params: { token: string } }) {
  const o = await db.order.findUnique({ where: { publicToken: params.token }, include: { invoice: true, subscription: true } });
  if (!o) notFound();
  const { lang, t } = getDict();
  const s = await getSettings();
  const paidOk = o.paymentMethod === "COD" || o.paymentStatus === "PAID";
  const waText = orderMessage(o);

  return (
    <div className="container-x max-w-xl py-14 text-center">
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${paidOk ? "bg-leaf-100" : "bg-amber-100"}`}>{paidOk ? "✅" : "⏳"}</div>
      <h1 className="mt-5 text-3xl font-extrabold">{paidOk ? t.success.title : t.success.pending}</h1>
      <p className="mt-3 text-lg">{fmt(t.success.msg, { name: o.customerName, company: o.companyName, time: shiftTime(o.shift) })}</p>

      <div className="card mt-8 divide-y divide-saffron-50 text-left text-sm">
        {[
          [t.success.orderNo, o.orderNo],
          [lang === "hi" ? "प्लान" : "Plan", `${o.planType === "MONTHLY" ? (lang === "hi" ? "मंथली" : "Monthly") : lang === "hi" ? "डेली" : "Daily"} · ${o.thaliType === "PANEER" ? "Paneer Special" : "Veg Thali"} × ${o.qty}`],
          [lang === "hi" ? "तारीख़" : "Date", o.subscription ? `${fmtDate(o.subscription.startDate, lang)} → ${fmtDate(o.subscription.endDate, lang)}` : fmtDate(o.deliveryDate, lang)],
          [lang === "hi" ? "शिफ्ट" : "Shift", o.shift],
          [lang === "hi" ? "कुल" : "Total", `₹${o.amount.toLocaleString("en-IN")} · ${o.paymentMethod === "COD" ? "Cash on delivery" : o.paymentStatus}`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-3"><span className="text-ink/60">{k}</span><span className="text-right font-semibold">{v}</span></div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {o.invoice && <Link href={`/invoice/${o.publicToken}`} className="btn-primary">🧾 {t.success.invoice}</Link>}
        <a href={`https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" className="btn-green">💬 {t.success.whatsapp}</a>
        <Link href="/" className="btn-ghost">{t.success.home}</Link>
      </div>
    </div>
  );
}
