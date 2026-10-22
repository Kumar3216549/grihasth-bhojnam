import Link from "next/link";
import { db } from "@/lib/db";
import { getDayPlan } from "@/lib/kitchen";
import { dbDate, ymdIST } from "@/lib/dates";
import { inr, waLink } from "@/lib/format";
import { getSettings, shiftList } from "@/lib/settings";
import { orderMessage } from "@/lib/whatsapp";
import { Badge, Flash, PageTitle, Stat, statusTone } from "@/components/admin/ui";
import AutoSubmitSelect from "@/components/admin/AutoSubmitSelect";
import DateNav from "@/components/admin/DateNav";
import { addPhoneOrder, markCashReceived, resendWhatsApp, setCompanyStatus, setOrderStatus } from "../actions";

const STATUS_OPTS = [
  { v: "NEW", l: "New" },
  { v: "CONFIRMED", l: "Confirmed" },
  { v: "PREPARING", l: "Preparing" },
  { v: "OUT_FOR_DELIVERY", l: "Out for delivery" },
  { v: "DELIVERED", l: "Delivered" },
  { v: "CANCELLED", l: "Cancelled" },
];

export default async function OrdersPage({ searchParams }: { searchParams: { date?: string; ok?: string; error?: string } }) {
  const today = ymdIST();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date || "") ? searchParams.date! : today;
  const d = dbDate(date);
  const [plan, other, areas, s] = await Promise.all([
    getDayPlan(d),
    db.order.findMany({
      where: { deliveryDate: d, OR: [{ status: "CANCELLED" }, { paymentMethod: "ONLINE", paymentStatus: { not: "PAID" } }] },
      orderBy: { createdAt: "desc" },
    }),
    db.area.findMany({ orderBy: { routeSeq: "asc" } }),
    getSettings(),
  ]);
  const codDue = plan.lines.filter((l) => l.paymentMethod === "COD" && l.paymentStatus !== "PAID").reduce((a, l) => a + (l.amount ?? 0), 0);

  return (
    <div>
      <PageTitle title="Orders — factory wise" hi="फैक्ट्री के हिसाब से ऑर्डर">
        <DateNav date={date} today={today} />
        <a href={`/api/admin/orders.csv?date=${date}`} className="a-btn-ghost">⬇️ CSV</a>
      </PageTitle>
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat tone="saffron" label="Tiffins" value={plan.total} sub={`${plan.veg} veg · ${plan.paneer} paneer`} />
        <Stat label="Factories" value={plan.byCompany.length} />
        <Stat label="Daily orders" value={plan.lines.filter((l) => l.source === "ORDER").length} sub={`${plan.lines.filter((l) => l.source === "SUBSCRIPTION").length} monthly subscribers`} />
        <Stat tone={codDue ? "amber" : "stone"} label="Cash to collect" value={inr(codDue)} />
      </div>

      {plan.closed && <p className="a-card mb-6 text-sm">Sunday — kitchen closed. Monthly tiffins are not delivered today.</p>}

      <div className="space-y-4">
        {plan.byCompany.map((c) => (
          <section key={c.companyName} className="a-card !p-0">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
              <div>
                <h2 className="font-semibold">🏭 {c.companyName} <span className="text-sm font-normal text-stone-500">· {c.areaName}</span></h2>
                <p className="text-xs text-stone-500">{c.address || "No address"} · {Object.entries(c.shifts).map(([s, n]) => `${s}: ${n}`).join(" · ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-saffron-500 px-3 py-1 text-lg font-bold text-white">{c.veg + c.paneer}</span>
                {c.companyId && (
                  <form action={setCompanyStatus} className="flex gap-1">
                    <input type="hidden" name="companyId" value={c.companyId} />
                    <input type="hidden" name="date" value={date} />
                    <button name="status" value="OUT_FOR_DELIVERY" className="a-btn-ghost !py-1 text-xs">🛵 Out</button>
                    <button name="status" value="DELIVERED" className="a-btn-ghost !py-1 text-xs">✅ Delivered</button>
                  </form>
                )}
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <tbody>
                  {c.lines.map((l) => (
                    <tr key={l.key} className="border-b border-stone-50 last:border-0">
                      <td className="a-td">
                        <p className="font-medium">{l.customerName}</p>
                        <a href={`tel:${l.phone}`} className="text-xs text-stone-500">{l.phone}</a>
                      </td>
                      <td className="a-td text-xs">{l.shift}</td>
                      <td className="a-td">
                        {l.source === "SUBSCRIPTION" ? <Badge tone="leaf">Monthly</Badge> : <Badge>{l.orderNo}</Badge>}
                      </td>
                      <td className="a-td text-sm">{l.veg ? `${l.veg} Veg` : ""}{l.veg && l.paneer ? " + " : ""}{l.paneer ? `${l.paneer} Paneer` : ""}</td>
                      <td className="a-td text-sm">
                        {l.source === "ORDER" && (
                          <>
                            {inr(l.amount ?? 0)}{" "}
                            {l.paymentStatus === "PAID" ? <Badge tone="leaf">Paid</Badge> : <Badge tone="amber">{l.paymentMethod}</Badge>}
                          </>
                        )}
                      </td>
                      <td className="a-td">
                        {l.orderId && (
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <form action={setOrderStatus}>
                              <input type="hidden" name="id" value={l.orderId} />
                              <AutoSubmitSelect name="status" defaultValue={l.status!} options={STATUS_OPTS} />
                            </form>
                            {l.paymentStatus !== "PAID" && (
                              <form action={markCashReceived}>
                                <input type="hidden" name="id" value={l.orderId} />
                                <button className="a-btn-ghost !py-1 text-xs">💵 Cash received</button>
                              </form>
                            )}
                            <form action={resendWhatsApp}>
                              <input type="hidden" name="id" value={l.orderId} />
                              <button className="a-btn-ghost !py-1 text-xs" title="Send WhatsApp auto message">📲</button>
                            </form>
                            <a className="a-btn-ghost !py-1 text-xs" target="_blank" rel="noopener" title="Open WhatsApp chat"
                              href={waLink(l.phone, orderMessage({ customerName: l.customerName, shift: l.shift, companyName: l.companyName, orderNo: l.orderNo! }))}>💬</a>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {plan.byCompany.length === 0 && !plan.closed && <p className="a-card text-sm text-stone-500">No tiffins for this date yet.</p>}
      </div>

      {other.length > 0 && (
        <section className="a-card mt-6">
          <h2 className="mb-2 font-semibold">Not counted (cancelled / online payment not completed)</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {other.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{o.orderNo} · {o.customerName} · {o.companyName} · ×{o.qty} · {inr(o.amount)}</span>
                <span className="flex gap-2"><Badge tone={statusTone(o.status)}>{o.status}</Badge><Badge tone="amber">{o.paymentStatus}</Badge></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="a-card mt-6">
        <h2 className="font-semibold">➕ Add phone / WhatsApp order (cash on delivery)</h2>
        <form action={addPhoneOrder} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input name="name" placeholder="Name" className="a-input" required />
          <input name="phone" placeholder="Mobile (10 digit)" className="a-input" required inputMode="numeric" />
          <input name="company" placeholder="Company / factory" className="a-input" required />
          <select name="areaSlug" className="a-input">{areas.map((a) => <option key={a.id} value={a.slug}>{a.nameEn}</option>)}</select>
          <select name="shift" className="a-input">{shiftList(s).map((x) => <option key={x}>{x}</option>)}</select>
          <select name="thaliType" className="a-input"><option value="VEG">Veg Thali</option><option value="PANEER">Paneer Special</option></select>
          <input name="qty" type="number" min={1} defaultValue={1} className="a-input" />
          <input name="date" type="date" defaultValue={date} className="a-input" />
          <input name="address" placeholder="Gate / address" className="a-input sm:col-span-2 lg:col-span-3" />
          <button className="a-btn">Save order</button>
        </form>
      </section>
      <p className="mt-4 text-xs text-stone-400">Tip: Mark “Out” when the delivery boy leaves; customers see confirmation on WhatsApp. <Link className="underline" href="/admin/routes">Plan the route →</Link></p>
    </div>
  );
}
