import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { dbDate, fmtDate, ymdIST } from "@/lib/dates";
import { SLOGAN } from "@/lib/i18n";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default async function InvoicePage({ params }: { params: { token: string } }) {
  const o = await db.order.findUnique({ where: { publicToken: params.token }, include: { invoice: true, subscription: true } });
  if (!o || !o.invoice) notFound();
  const s = await getSettings();
  const inv = o.invoice;
  const desc =
    o.planType === "MONTHLY"
      ? `Monthly Tiffin Plan (${o.subscription ? `${fmtDate(o.subscription.startDate)} – ${fmtDate(o.subscription.endDate)}` : ""}) · ${o.shift}`
      : `${o.thaliType === "PANEER" ? "Paneer Special Thali" : "Veg Thali"} · ${fmtDate(o.deliveryDate)} · ${o.shift}`;

  return (
    <div className="min-h-screen bg-stone-100 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl justify-end gap-2 px-4"><PrintButton /></div>
      <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm sm:p-12 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-saffron-500 pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.svg" alt="Grihasth Bhojnam logo" className="h-16 w-16" />
            <div>
              <p className="font-hindi text-2xl font-bold text-saffron-700">गृहस्थ भोजनम्</p>
              <p className="text-sm font-semibold text-leaf-700">Grihasth Bhojnam by Sachin</p>
              <p className="mt-1 max-w-xs text-xs text-stone-500">{s.kitchenAddress}</p>
              <p className="text-xs text-stone-500">📞 {s.businessPhone}</p>
              {s.fssaiNo && <p className="text-xs text-stone-500">FSSAI: {s.fssaiNo}</p>}
              {s.gstin && <p className="text-xs text-stone-500">GSTIN: {s.gstin}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold tracking-wide text-ink">INVOICE</p>
            <p className="mt-1 text-sm"><span className="text-stone-500">No.</span> <b>{inv.number}</b></p>
            <p className="text-sm"><span className="text-stone-500">Date</span> {fmtDate(dbDate(ymdIST(inv.issuedAt)))}</p>
            <p className="text-sm"><span className="text-stone-500">Order</span> {o.orderNo}</p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Billed to</p>
            <p className="mt-1 font-semibold">{o.customerName}</p>
            <p className="text-sm">{o.companyName}</p>
            <p className="text-sm text-stone-600">{o.address}{o.address ? ", " : ""}{o.areaName}</p>
            <p className="text-sm text-stone-600">+91 {o.phone}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Payment</p>
            <p className="mt-1 font-semibold">{o.paymentStatus === "PAID" ? "PAID ✓" : o.paymentStatus}</p>
            <p className="text-sm text-stone-600">{o.paymentMethod === "ONLINE" ? "Online (Razorpay)" : "Cash"}</p>
            {o.razorpayPaymentId && <p className="text-xs text-stone-500">Ref: {o.razorpayPaymentId}</p>}
          </div>
        </section>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="bg-saffron-50 text-left">
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Rate</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-100">
              <td className="px-3 py-3">{desc}<br /><span className="text-xs text-stone-500">4 Tawa Roti, Rice, Dal Fry, Sabji, Salad</span></td>
              <td className="px-3 py-3 text-right">{o.qty}</td>
              <td className="px-3 py-3 text-right">₹{o.unitPrice.toLocaleString("en-IN")}</td>
              <td className="px-3 py-3 text-right">₹{o.amount.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-3 pt-4 text-right font-semibold">Total</td>
              <td className="px-3 pt-4 text-right text-xl font-extrabold">₹{inv.amount.toLocaleString("en-IN")}</td>
            </tr>
          </tfoot>
        </table>
        {!s.gstin && <p className="mt-2 text-right text-xs text-stone-500">Not registered under GST — no tax charged.</p>}

        <footer className="mt-12 border-t border-stone-200 pt-6 text-center">
          <p className="font-hindi text-lg font-semibold text-saffron-700">{SLOGAN.hi}</p>
          <p className="text-sm text-leaf-700">{SLOGAN.en}</p>
          <p className="mt-3 text-xs text-stone-400">This is a computer-generated invoice.</p>
        </footer>
      </article>
    </div>
  );
}
