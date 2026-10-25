import Link from "next/link";
import { db } from "@/lib/db";
import { getDayPlan, getRequirements } from "@/lib/kitchen";
import { getPnL } from "@/lib/finance";
import { addDays, monthRange, todayDb, ymdIST, fmtDate } from "@/lib/dates";
import { inr, num } from "@/lib/format";
import { Badge, BarChart, PageTitle, Stat } from "@/components/admin/ui";

export default async function Dashboard() {
  const today = todayDb();
  const ym = ymdIST().slice(0, 7);
  const { start, end } = monthRange(ym);
  const monthEnd = end < today ? end : today;

  const [plan, tomorrow, activeSubs, expiring, pendingOnline, newOrders, pnl] = await Promise.all([
    getDayPlan(today),
    getDayPlan(addDays(today, 1)),
    db.subscription.count({ where: { status: "ACTIVE", endDate: { gte: today } } }),
    db.subscription.findMany({ where: { status: "ACTIVE", endDate: { gte: today, lte: addDays(today, 3) } }, include: { customer: true, company: true }, orderBy: { endDate: "asc" } }),
    db.order.count({ where: { paymentMethod: { in: ["ONLINE", "UPI"] }, paymentStatus: "PENDING", status: { not: "CANCELLED" }, createdAt: { gte: addDays(today, -7) } } }),
    db.order.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "desc" }, take: 6 }),
    getPnL(start, monthEnd),
  ]);
  const req = await getRequirements(plan.veg, plan.paneer);
  const lowStock = req.filter((r) => r.low || r.short > 0);
  const todayRevenue = plan.lines.reduce((a, l) => a + (l.source === "ORDER" && l.paymentStatus === "PAID" ? l.amount ?? 0 : 0), 0);
  const codDue = plan.lines.reduce((a, l) => a + (l.source === "ORDER" && l.paymentMethod === "COD" && l.paymentStatus !== "PAID" ? l.amount ?? 0 : 0), 0);

  return (
    <div>
      <PageTitle title="Namaste Sachin 🙏" hi={`आज ${fmtDate(today, "hi")} — ${plan.closed ? "रविवार, रसोई बंद" : `${plan.toCook} टिफ़िन बनाने हैं`}`}>
        <Link href="/admin/kitchen" className="a-btn">🍱 Kitchen sheet</Link>
        <Link href="/admin/routes" className="a-btn-ghost">🛵 Route</Link>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="saffron" icon="🍱" label="Tiffins to cook today" value={plan.toCook} sub={`${plan.veg} veg · ${plan.paneer} paneer · +${plan.buffer} buffer`} />
        <Stat icon="🏭" label="Delivery stops today" value={plan.byCompany.length} sub={Object.entries(plan.byShift).map(([s, n]) => `${s.replace(/^\w+ /, "")}: ${n}`).join(" · ") || "—"} />
        <Stat tone="leaf" icon="👥" label="Active monthly" value={activeSubs} sub={`${expiring.length} expiring in 3 days`} />
        <Stat icon="📅" label="Tomorrow" value={tomorrow.closed ? "Closed" : tomorrow.toCook} sub={tomorrow.closed ? "Sunday" : `${tomorrow.byCompany.length} stops`} />
        <Stat icon="💵" label="Paid today" value={inr(todayRevenue)} sub={`COD to collect: ${inr(codDue)}`} />
        <Stat tone={pnl.profit >= 0 ? "leaf" : "red"} icon="💰" label="Profit this month" value={inr(pnl.profit)} sub={`Revenue ${inr(pnl.revenue)} · Exp ${inr(pnl.expenseTotal)}`} />
        <Stat icon="🧮" label="Food cost / tiffin" value={inr(pnl.costPerTiffin.veg)} sub={`Paneer: ${inr(pnl.costPerTiffin.paneer)}`} />
        <Link href="/admin/orders#verify"><Stat tone={pendingOnline ? "amber" : "stone"} icon="⏳" label="UPI to verify" value={pendingOnline} sub="last 7 days · check bank first" /></Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="a-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">This month: revenue vs expense</h2>
            <Link href="/admin/finance" className="text-sm text-saffron-700 hover:underline">P&L →</Link>
          </div>
          <BarChart data={pnl.days.map((d) => ({ label: d.date, a: d.revenue, b: d.expense }))} />
          <p className="mt-3 text-xs text-stone-500">{pnl.tiffins} tiffins served this month · margin {num(pnl.margin, 0)}%</p>
        </section>

        <section className={`a-card ${lowStock.length ? "!border-red-200" : ""}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Stock alerts</h2>
            <Link href="/admin/inventory" className="text-sm text-saffron-700 hover:underline">Inventory →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-leaf-700">✓ Enough stock for today.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2">
                  <span><b>{r.nameEn}</b> <span className="font-hindi text-stone-500">{r.nameHi}</span></span>
                  <span className="text-right text-xs">
                    {num(r.stock)} {r.unit} left
                    {r.short > 0 && <span className="block font-semibold text-red-700">short {num(r.short)} {r.unit} today</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="a-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Today by factory</h2>
            <Link href="/admin/orders" className="text-sm text-saffron-700 hover:underline">All orders →</Link>
          </div>
          {plan.byCompany.length === 0 ? (
            <p className="text-sm text-stone-500">No deliveries today.</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-stone-100"><th className="a-th">Factory</th><th className="a-th">Area</th><th className="a-th">Shift</th><th className="a-th text-right">Tiffins</th></tr></thead>
              <tbody>
                {plan.byCompany.map((c) => (
                  <tr key={c.companyName} className="border-b border-stone-50">
                    <td className="a-td font-medium">{c.companyName}</td>
                    <td className="a-td text-stone-500">{c.areaName}</td>
                    <td className="a-td text-xs">{Object.entries(c.shifts).map(([s, n]) => <div key={s}>{s}: {n}</div>)}</td>
                    <td className="a-td text-right font-bold">{c.veg + c.paneer}{c.paneer > 0 && <span className="ml-1 text-xs font-normal text-saffron-700">({c.paneer} P)</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="a-card">
          <h2 className="mb-3 font-semibold">Renewals due</h2>
          {expiring.length === 0 ? <p className="text-sm text-stone-500">None in next 3 days.</p> : (
            <ul className="space-y-2 text-sm">
              {expiring.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span>{s.customer.name}<span className="block text-xs text-stone-500">{s.company?.name}</span></span>
                  <Badge tone="amber">{fmtDate(s.endDate)}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/subscribers" className="mt-3 inline-block text-sm text-saffron-700 hover:underline">Send reminders →</Link>

          <h2 className="mb-2 mt-6 font-semibold">New orders</h2>
          {newOrders.length === 0 ? <p className="text-sm text-stone-500">All caught up.</p> : (
            <ul className="space-y-1.5 text-sm">
              {newOrders.map((o) => (
                <li key={o.id} className="flex justify-between gap-2">
                  <span className="truncate">{o.customerName} · {o.companyName}</span>
                  <span className="whitespace-nowrap text-xs text-stone-500">{o.planType === "MONTHLY" ? "M" : "D"} ×{o.qty}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
