import { getDayPlan, getRequirements } from "@/lib/kitchen";
import { dbDate, fmtDate, ymdIST } from "@/lib/dates";
import { getMenu } from "@/lib/menu";
import { getSettings, paneerDayList } from "@/lib/settings";
import { num } from "@/lib/format";
import { PageTitle, Stat } from "@/components/admin/ui";
import DateNav from "@/components/admin/DateNav";
import WhatIf from "./WhatIf";
import { consumeForDay } from "../actions";

export default async function KitchenPage({ searchParams }: { searchParams: { date?: string } }) {
  const today = ymdIST();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date || "") ? searchParams.date! : today;
  const d = dbDate(date);
  const s = await getSettings();
  const [plan, menu] = await Promise.all([getDayPlan(d), getMenu(d, paneerDayList(s), s.riceType)]);
  const req = await getRequirements(plan.veg, plan.paneer);
  const factor = 1 + plan.bufferPct / 100;

  return (
    <div>
      <PageTitle title="Tiffin Count Calculator" hi="आज कितने टिफ़िन बनाने हैं — अपने आप गिनती">
        <DateNav date={date} today={today} />
      </PageTitle>

      <div className="a-card mb-6 flex flex-wrap items-center justify-between gap-6 !bg-gradient-to-r from-saffron-500 to-saffron-600 !text-white">
        <div>
          <p className="text-sm opacity-90">{fmtDate(d)} · {menu.closed ? "Kitchen closed" : `${menu.rice === "plain" ? "Plain rice" : "Jeera rice"} · Mix veg${menu.isPaneer ? " + Paneer butter masala" : ""}`}</p>
          <p className="mt-1 text-5xl font-extrabold tabular-nums">{plan.toCook}</p>
          <p className="text-sm opacity-90">tiffins to make = {plan.total} booked + {plan.buffer} buffer ({plan.bufferPct}%)</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
          <div className="rounded-xl bg-white/15 px-4 py-3"><p className="text-2xl font-bold">{Math.ceil(plan.toCook * 4)}</p><p className="text-xs">Tawa roti</p></div>
          <div className="rounded-xl bg-white/15 px-4 py-3"><p className="text-2xl font-bold">{Math.ceil(plan.veg * factor)}</p><p className="text-xs">Veg sabji</p></div>
          <div className="rounded-xl bg-white/15 px-4 py-3"><p className="text-2xl font-bold">{Math.ceil(plan.paneer * factor)}</p><p className="text-xs">Paneer sabji</p></div>
          <div className="rounded-xl bg-white/15 px-4 py-3"><p className="text-2xl font-bold">{plan.toCook * 2}</p><p className="text-xs">Mukhwas packets</p></div>
          <div className="rounded-xl bg-white/15 px-4 py-3"><p className="text-2xl font-bold">{plan.toCook * 2}</p><p className="text-xs">Tissue papers</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="a-card">
          <h2 className="mb-3 font-semibold">By shift (pack in this order)</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(plan.byShift).sort().map(([sh, n]) => <Stat key={sh} label={sh} value={n} />)}
            {Object.keys(plan.byShift).length === 0 && <p className="text-sm text-stone-500">No tiffins booked.</p>}
          </div>
          <h2 className="mb-2 mt-5 font-semibold">By factory</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {plan.byCompany.map((c) => (
              <li key={c.companyName} className="flex justify-between py-1.5"><span>{c.companyName} <span className="text-stone-400">· {c.areaName}</span></span><b>{c.veg + c.paneer}{c.paneer ? ` (${c.paneer}P)` : ""}</b></li>
            ))}
          </ul>
        </section>

        <section className="a-card">
          <h2 className="mb-3 font-semibold">Raw material needed vs stock</h2>
          <table className="w-full">
            <thead><tr className="border-b border-stone-100"><th className="a-th">Item</th><th className="a-th text-right">Need</th><th className="a-th text-right">In stock</th><th className="a-th text-right">Status</th></tr></thead>
            <tbody>
              {req.map((r) => {
                const need = r.need * factor;
                const short = Math.max(0, need - r.stock);
                return (
                  <tr key={r.id} className="border-b border-stone-50">
                    <td className="a-td">{r.nameEn} <span className="font-hindi text-xs text-stone-400">{r.nameHi}</span></td>
                    <td className="a-td text-right tabular-nums">{num(need, 2)} {r.unit}</td>
                    <td className="a-td text-right tabular-nums">{num(r.stock, 2)} {r.unit}</td>
                    <td className="a-td text-right">{short > 0 ? <span className="font-semibold text-red-600">Buy {num(short, 2)}</span> : <span className="text-leaf-700">OK</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <form action={consumeForDay} className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-stone-50 p-3">
            <input type="hidden" name="date" value={date} />
            <p className="text-xs text-stone-600">After cooking, deduct this usage from inventory in one click.</p>
            <button className="a-btn whitespace-nowrap" disabled={plan.toCook === 0}>Deduct stock</button>
          </form>
        </section>
      </div>

      <section className="a-card mt-6">
        <h2 className="mb-1 font-semibold">What-if calculator</h2>
        <p className="mb-3 text-sm text-stone-500">New factory asking for 50 tiffins? See material and cost instantly.</p>
        <WhatIf items={req.map((r) => ({ name: r.nameEn, unit: r.unit, veg: r.perVegTiffin, paneer: r.perPaneerTiffin, cost: r.costPerUnit }))} />
      </section>
    </div>
  );
}
