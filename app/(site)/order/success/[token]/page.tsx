import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getDict } from "@/lib/lang";
import { fmt } from "@/lib/i18n";
import { fmtDate } from "@/lib/dates";
import { shiftTime } from "@/lib/whatsapp";
import { getSettings, upiReady } from "@/lib/settings";
import { DISH } from "@/lib/menu";
import { includedItems } from "@/lib/menuView";
import { Divider } from "@/components/Ornament";
import UpiPayPanel from "./UpiPayPanel";
import QrCode from "@/components/QrCode";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function Success({ params }: { params: { token: string } }) {
  const o = await db.order.findUnique({ where: { publicToken: params.token }, include: { invoice: true, subscription: true } });
  if (!o) notFound();
  const { lang, t } = getDict();
  const s = await getSettings();
  const L = (d: { en: string; hi: string }) => (lang === "hi" ? d.hi : d.en);
  const amount = o.amount.toLocaleString("en-IN");
  const paid = o.paymentStatus === "PAID";
  const isUpi = o.paymentMethod === "UPI";
  const cancelled = o.status === "CANCELLED";

  const state = paid ? "paid" : o.paymentMethod === "COD" ? "cod" : isUpi && o.upiRef ? "verify" : isUpi ? "upi" : "pending";
  const head = {
    paid: { icon: "✅", tone: "bg-leaf-100", title: t.success.paidTitle, msg: fmt(t.success.msg, { name: o.customerName, company: o.companyName, time: shiftTime(o.shift) }) },
    cod: { icon: "✅", tone: "bg-leaf-100", title: t.success.codTitle, msg: fmt(t.success.codMsg, { amount }) },
    upi: { icon: "📱", tone: "bg-saffron-100", title: t.success.upiTitle, msg: fmt(t.success.upiMsg, { amount }) },
    verify: { icon: "⏳", tone: "bg-amber-100", title: t.success.verifyTitle, msg: t.success.verifyMsg },
    pending: { icon: "⏳", tone: "bg-amber-100", title: t.success.verifyTitle, msg: "" },
  }[state];
  const payLabel = paid ? t.success.pay.paid : o.paymentMethod === "COD" ? t.success.pay.cod : isUpi ? (o.upiRef ? t.success.pay.upiVerifying : t.success.pay.upiWaiting) : t.success.pay.online;
  const thali = o.thaliType === "PANEER" ? t.order.paneer : t.order.veg;
  const pageLink = `${SITE_URL}/order/success/${o.publicToken}`;
  const waText = fmt(t.qr.waMsg, { orderNo: o.orderNo, name: o.customerName, qty: o.qty, dish: o.dishName || "-", company: o.companyName, address: o.address || o.areaName, time: o.shift, link: pageLink });
  const qrValue = `${SITE_URL}/admin/scan?c=${o.publicToken}`;

  return (
    <div className="container-x max-w-xl py-14 text-center">
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ring-8 ring-white ${head.tone}`} aria-hidden>{head.icon}</div>
      <h1 className="mt-5 text-3xl font-extrabold text-earth-800">{head.title}</h1>
      {head.msg && <p className="mt-3 text-lg">{head.msg}</p>}
      <Divider className="mt-4" />

      {!cancelled && o.planType === "DAILY" && (
        <div className="mt-8">
          {o.collectedAt ? (
            <p className="rounded-xl bg-leaf-50 p-4 text-lg font-bold text-leaf-800">{t.qr.collected}</p>
          ) : (
            <>
              <p className="mb-4 rounded-xl bg-saffron-50 p-4 text-base font-semibold text-earth-800">{t.qr.thanks}</p>
              <QrCode value={qrValue} label={t.qr.alt} />
              <p className="mt-2 text-sm font-semibold">{o.orderNo}</p>
              <p className="text-xs text-ink/60">{t.qr.save}</p>
            </>
          )}
        </div>
      )}

      {isUpi && !paid && !cancelled && (
        upiReady(s) ? (
          <UpiPayPanel
            t={t.success.upi}
            token={o.publicToken}
            amount={o.amount}
            orderNo={o.orderNo}
            upiId={s.upiId.trim()}
            payee={s.upiPayeeName || "Grihasth Bhojnam"}
            qrUrl={s.upiQrUrl.trim()}
            existingRef={o.upiRef}
          />
        ) : (
          <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{t.success.upi.notReady}</p>
        )
      )}

      <div className="card mt-8 divide-y divide-earth-50 text-left text-sm">
        {[
          [t.success.orderNo, o.orderNo],
          [t.success.status, t.success.statuses[o.status] ?? o.status],
          [t.success.plan, `${o.planType === "MONTHLY" ? t.success.monthlyLabel : `${t.success.dailyLabel} · ${thali}`} × ${o.qty}`],
          [t.success.date, o.subscription ? `${fmtDate(o.subscription.startDate, lang)} → ${fmtDate(o.subscription.endDate, lang)}` : fmtDate(o.deliveryDate, lang)],
          [t.success.shift, o.shift],
          [t.quick.todayDish, o.dishName || "-"],
          [t.success.total, `₹${amount}`],
          [t.success.payment, payLabel],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-3"><span className="text-ink/60">{k}</span><span className="text-right font-semibold">{v}</span></div>
        ))}
        <div className="px-5 py-3">
          <p className="text-ink/60">{t.success.items}</p>
          <p className="mt-1 font-medium">{[DISH.roti, DISH.rice, DISH.dal, o.thaliType === "PANEER" ? DISH.paneer : DISH.sabji, DISH.salad].map(L).join(" · ")}</p>
          <p className="mt-1 font-medium text-leaf-800">+ {includedItems(lang).map((i) => i.label).join(" · ")}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {o.invoice && <Link href={`/invoice/${o.publicToken}`} className="btn-primary">🧾 {t.success.invoice}</Link>}
        <a href={`https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" className="btn-green">💬 {t.qr.sendWa}</a>
        <Link href="/" className="btn-ghost">{t.success.home}</Link>
      </div>
    </div>
  );
}
