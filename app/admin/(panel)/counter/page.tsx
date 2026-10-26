import Link from "next/link";
import { db } from "@/lib/db";
import { dishLabel, getMenu } from "@/lib/menu";
import { getSettings, paneerDayList } from "@/lib/settings";
import { todayDb } from "@/lib/dates";
import { inr } from "@/lib/format";
import { Badge, Flash, PageTitle, Stat } from "@/components/admin/ui";
import QrScanner from "@/components/admin/QrScanner";
import { collectOrder, saveTodayDish, setPaymentStatus } from "../actions";

export const dynamic = "force-dynamic";
const time = (d: Date) => d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

export default async function CounterPage({ searchParams }: { searchParams: { ok?: string; q?: string } }) {
  const today = todayDb();
  const s = await getSettings();
  const menu = await getMenu(today, paneerDayList(s), s.riceType);
  const q = (searchParams.q || "").trim();
  const orders = await db.order.findMany({
    where: {
      deliveryDate: today,
      planType: "DAILY",
      status: { not: "CANCELLED" },
      ...(q ? { OR: [{ customerName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { orderNo: { contains: q.toUpperCase() } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  const thalis = orders.reduce((a, o) => a + o.qty, 0);
  const collected = orders.filter((o) => o.collectedAt).reduce((a, o) => a + o.qty, 0);
  const unpaid = orders.filter((o) => o.paymentStatus !== "PAID").reduce((a, o) => a + o.amount, 0);

  return (
    <div>
      <PageTitle title="Counter — today's thali" hi="आज की थाली · QR स्कैन · भुगतान" />
      <Flash ok={searchParams.ok} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat tone="saffron" label="Thalis ordered" value={thalis} />
            <Stat tone="leaf" label="Collected" value={`${collected}/${thalis}`} />
            <Stat tone={unpaid ? "amber" : "stone"} label="Unpaid" value={inr(unpaid)} />
          </div>

          <form className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Search name, phone or order no." className="a-input" />
            <button className="a-btn-ghost">Search</button>
          </form>

          <div className="a-card overflow-x-auto !p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-stone-50"><tr>
                <th className="a-th">Customer</th><th className="a-th">Dish</th><th className="a-th">Qty</th><th className="a-th">Time</th><th className="a-th">Payment</th><th className="a-th">Collection</th>
              </tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-stone-100">
                    <td className="a-td">
                      <Link href={`/admin/scan?c=${o.publicToken}`} className="font-medium text-saffron-700 hover:underline">{o.customerName}</Link>
                      <a href={`tel:+91${o.phone}`} className="block text-xs text-stone-500">{o.phone}</a>
                      <span className="text-xs text-stone-400">{o.orderNo} · {o.companyName}</span>
                    </td>
                    <td className="a-td">{o.dishName || "—"}</td>
                    <td className="a-td font-bold">{o.qty}</td>
                    <td className="a-td">{time(o.createdAt)}<span className="block text-xs text-stone-400">{o.shift}</span></td>
                    <td className="a-td">
                      <form action={setPaymentStatus} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="back" value="/admin/counter" />
                        {o.paymentStatus === "PAID" ? <Badge tone="leaf">Paid {inr(o.amount)}</Badge> : <Badge tone="amber">Unpaid {inr(o.amount)}</Badge>}
                        <button name="paid" value={o.paymentStatus === "PAID" ? "0" : "1"} className="a-btn-ghost !px-2 !py-1 text-xs">{o.paymentStatus === "PAID" ? "Mark unpaid" : "Mark paid"}</button>
                      </form>
                    </td>
                    <td className="a-td">
                      {o.collectedAt ? (
                        <Badge tone="leaf">Collected {time(o.collectedAt)}</Badge>
                      ) : (
                        <form action={collectOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="back" value="/admin/counter" />
                          <button className="a-btn !py-1 text-xs">Hand over</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={6} className="a-td text-stone-500">No thali orders for today yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <QrScanner />
          <form action={saveTodayDish} className="a-card space-y-3">
            <h2 className="font-semibold">🍛 Today&apos;s dish & price</h2>
            <p className="text-xs text-stone-500">Leave the name blank to use the weekly menu: <b>{menu.dishes.map((d) => d.en).join(" + ") || "Sunday — closed"}</b>. Now showing: <b>{dishLabel(menu, "en") || "—"}</b></p>
            <input name="customEn" defaultValue={menu.customEn} placeholder="Dish name (English)" className="a-input" />
            <input name="customHi" defaultValue={menu.customHi} placeholder="व्यंजन का नाम (हिंदी)" className="a-input font-hindi" />
            <label className="block text-sm">Thali price ₹
              <input name="dailyPrice" type="number" min={1} defaultValue={s.dailyPrice} className="a-input mt-1" />
            </label>
            <button className="a-btn w-full">Save</button>
          </form>
          <Link href="/thali" target="_blank" className="a-btn-ghost w-full">🌐 Open customer order page</Link>
        </div>
      </div>
    </div>
  );
}
