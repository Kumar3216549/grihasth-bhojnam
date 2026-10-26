import Link from "next/link";
import { db } from "@/lib/db";
import { inr, waLink } from "@/lib/format";
import { fmtDate } from "@/lib/dates";
import { SITE_URL } from "@/lib/site";
import QrScanner from "@/components/admin/QrScanner";
import { collectOrder, setPaymentStatus } from "../actions";

export const dynamic = "force-dynamic";
const dt = (d: Date) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Opened by scanning an order QR (or from the counter list). Shows everything and allows ONE hand-over. */
export default async function ScanPage({ searchParams }: { searchParams: { c?: string; new?: string } }) {
  const token = (searchParams.c || "").replace(/[^A-Za-z0-9_-]/g, "");
  const o = token ? await db.order.findUnique({ where: { publicToken: token } }) : null;
  const back = `/admin/scan?c=${token}`;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold">📷 Scan order QR</h1>
      {token && !o && <p className="a-card border-red-300 bg-red-50 text-lg font-bold text-red-700">❌ Invalid QR — no such order.</p>}

      {o && (
        <div className={`a-card space-y-3 border-2 ${o.collectedAt ? "border-red-400" : o.status === "CANCELLED" ? "border-stone-400" : "border-leaf-500"}`}>
          {o.collectedAt ? (
            <p className="rounded-lg bg-red-600 p-3 text-center text-lg font-extrabold text-white">⚠️ ALREADY COLLECTED — {dt(o.collectedAt)}<br /><span className="text-sm font-medium">Do not give the meal again.</span></p>
          ) : o.status === "CANCELLED" ? (
            <p className="rounded-lg bg-stone-600 p-3 text-center text-lg font-bold text-white">Order cancelled</p>
          ) : (
            <p className="rounded-lg bg-leaf-600 p-3 text-center text-lg font-extrabold text-white">✅ Valid order — ready to hand over</p>
          )}
          <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-sm">
            <dt className="text-stone-500">Order</dt><dd className="font-semibold">{o.orderNo}</dd>
            <dt className="text-stone-500">Name</dt><dd className="text-lg font-bold">{o.customerName}</dd>
            <dt className="text-stone-500">Phone</dt><dd><a href={`tel:+91${o.phone}`} className="text-saffron-700">{o.phone}</a></dd>
            <dt className="text-stone-500">Company</dt><dd>{o.companyName}</dd>
            <dt className="text-stone-500">Address</dt><dd>{o.address || o.areaName}</dd>
            <dt className="text-stone-500">Dish</dt><dd>{o.dishName || "—"}</dd>
            <dt className="text-stone-500">Quantity</dt><dd className="text-2xl font-extrabold">{o.qty}</dd>
            <dt className="text-stone-500">For</dt><dd>{fmtDate(o.deliveryDate)} · {o.shift}</dd>
            <dt className="text-stone-500">Ordered at</dt><dd>{dt(o.createdAt)}</dd>
            <dt className="text-stone-500">Amount</dt><dd className="font-semibold">{inr(o.amount)}</dd>
            <dt className="text-stone-500">Payment</dt>
            <dd>{o.paymentStatus === "PAID" ? <span className="font-bold text-leaf-700">PAID ✓</span> : <span className="font-bold text-amber-700">UNPAID ({o.paymentMethod === "UPI" ? "UPI to verify" : "collect cash"})</span>}</dd>
          </dl>

          <div className="grid grid-cols-2 gap-2">
            <form action={setPaymentStatus}>
              <input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value={back} />
              <button name="paid" value={o.paymentStatus === "PAID" ? "0" : "1"} className={`w-full ${o.paymentStatus === "PAID" ? "a-btn-ghost" : "a-btn !bg-amber-500"} !py-3`}>
                {o.paymentStatus === "PAID" ? "Mark unpaid" : `💵 Mark paid ${inr(o.amount)}`}
              </button>
            </form>
            <form action={collectOrder}>
              <input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value={back} />
              <button disabled={!!o.collectedAt || o.status === "CANCELLED"} className="a-btn w-full !py-3">🍱 Hand over meal</button>
            </form>
          </div>

          {searchParams.new && (
            <div className="rounded-lg bg-saffron-50 p-3 text-sm">
              <p className="font-semibold">New order saved. Send the QR to the customer:</p>
              <a className="a-btn mt-2 w-full !bg-[#25D366]" target="_blank" rel="noopener"
                href={waLink(o.phone, `Namaste ${o.customerName} 🙏 Your Grihasth Bhojnam order ${o.orderNo} (${o.qty} thali) is confirmed. Show this QR at the counter: ${SITE_URL}/order/success/${o.publicToken}`)}>
                💬 Send QR on WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      <QrScanner />
      <Link href="/admin/counter" className="a-btn-ghost w-full">← Counter list</Link>
    </div>
  );
}
