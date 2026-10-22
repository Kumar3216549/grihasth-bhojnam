import { getPnL } from "@/lib/finance";
import { fmtDate, monthRange, todayDb, ymdIST } from "@/lib/dates";
import { inr, num } from "@/lib/format";
import { getSettings, prices } from "@/lib/settings";
import { BarChart, PageTitle, Stat } from "@/components/admin/ui";
import { addExpense, deleteExpense } from "../actions";

const CATEGORIES = ["Grocery", "Gas", "Salary", "Delivery / Fuel", "Packaging", "Rent", "Electricity", "Marketing", "Repairs", "Other"];

export default async function FinancePage({ searchParams }: { searchParams: { month?: string } }) {
  const cur = ymdIST().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(searchParams.month || "") ? searchParams.month! : cur;
  const { start, end } = monthRange(month);
  const today = todayDb();
  const until = month === cur && end > today ? today : end;
  const [pnl, s] = await Promise.all([getPnL(start, until), getSettings()]);
  const p = prices(s);
  const unitProfitDaily = p.daily - pnl.costPerTiffin.veg;
  const unitProfitMonthly = p.perMonthly - pnl.costPerTiffin.veg;
  const fixedCats = ["Salary", "Rent", "Electricity", "Gas"];
  const fixed = Object.entries(pnl.byCategory).filter(([k]) => fixedCats.includes(k)).reduce((a, [, v]) => a + v, 0);
  const breakEven = unitProfitDaily > 0 ? Math.ceil(fixed / unitProfitDaily) : 0;

  return (
    <div>
      <PageTitle title="Profit & Loss" hi="मुनाफ़ा / नुकसान — कमाई और खर्च">
        <form className="flex gap-2"><input type="month" name="month" defaultValue={month} className="a-input !w-auto" /><button className="a-btn-ghost">Show</button></form>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="leaf" icon="💵" label="Revenue (paid)" value={inr(pnl.revenue)} sub={`Daily ${inr(pnl.revenueDaily)} · Monthly ${inr(pnl.revenueMonthly)}`} />
        <Stat tone="amber" icon="🧾" label="Expenses" value={inr(pnl.expenseTotal)} sub={`${pnl.expenses.length} entries`} />
        <Stat tone={pnl.profit >= 0 ? "leaf" : "red"} icon="💰" label={pnl.profit >= 0 ? "Profit" : "Loss"} value={inr(pnl.profit)} sub={`Margin ${num(pnl.margin, 1)}%`} />
        <Stat icon="🍱" label="Tiffins served" value={pnl.tiffins} sub={`Avg ${inr(pnl.revenuePerTiffin)} / tiffin`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="a-card lg:col-span-2">
          <h2 className="mb-3 font-semibold">Daily revenue vs expense — {month}</h2>
          <BarChart data={pnl.days.map((d) => ({ label: d.date, a: d.revenue, b: d.expense }))} />
        </section>
        <section className="a-card">
          <h2 className="mb-3 font-semibold">Unit economics</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Ingredient cost / veg tiffin</dt><dd className="font-semibold">₹{num(pnl.costPerTiffin.veg, 1)}</dd></div>
            <div className="flex justify-between"><dt>Ingredient cost / paneer tiffin</dt><dd className="font-semibold">₹{num(pnl.costPerTiffin.paneer, 1)}</dd></div>
            <div className="flex justify-between"><dt>Gross margin / daily tiffin (₹{p.daily})</dt><dd className="font-semibold text-leaf-700">₹{num(unitProfitDaily, 1)}</dd></div>
            <div className="flex justify-between"><dt>Gross margin / monthly tiffin (₹{p.perMonthly})</dt><dd className="font-semibold text-leaf-700">₹{num(unitProfitMonthly, 1)}</dd></div>
            <div className="flex justify-between border-t border-stone-100 pt-2"><dt>Estimated food cost this month</dt><dd className="font-semibold">{inr(pnl.foodCostEstimate)}</dd></div>
            <div className="flex justify-between"><dt>Fixed costs (salary, rent, gas, power)</dt><dd className="font-semibold">{inr(fixed)}</dd></div>
            <div className="flex justify-between"><dt>Break-even tiffins (month)</dt><dd className="font-semibold">{breakEven || "—"}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-stone-500">Ingredient cost comes from Inventory → “per tiffin” × purchase rate. Keep rates updated when you buy stock.</p>
        </section>

        <section className="a-card">
          <h2 className="mb-3 font-semibold">Expenses by category</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(pnl.byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <li key={k}>
                <div className="flex justify-between"><span>{k}</span><b>{inr(v)}</b></div>
                <div className="mt-1 h-1.5 rounded bg-stone-100"><div className="h-1.5 rounded bg-saffron-400" style={{ width: `${(v / Math.max(1, pnl.expenseTotal)) * 100}%` }} /></div>
              </li>
            ))}
            {pnl.expenses.length === 0 && <li className="text-stone-500">No expenses recorded.</li>}
          </ul>
        </section>

        <section className="a-card lg:col-span-2">
          <h2 className="mb-3 font-semibold">➕ Add expense</h2>
          <form action={addExpense} className="grid gap-2 sm:grid-cols-5">
            <input type="date" name="date" defaultValue={ymdIST()} className="a-input" />
            <select name="category" className="a-input">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input type="number" name="amount" min={1} placeholder="₹ Amount" className="a-input" required />
            <input name="note" placeholder="Note" className="a-input" />
            <button className="a-btn">Add</button>
          </form>
          <p className="mt-2 text-xs text-stone-500">Grocery purchases added through Inventory “+ In” with a rate are recorded here automatically.</p>
          <div className="mt-4 max-h-80 overflow-y-auto">
            <table className="w-full">
              <tbody>
                {pnl.expenses.map((e) => (
                  <tr key={e.id} className="border-t border-stone-100">
                    <td className="a-td text-xs text-stone-500">{fmtDate(e.date)}</td>
                    <td className="a-td">{e.category}</td>
                    <td className="a-td text-xs text-stone-500">{e.note}</td>
                    <td className="a-td text-right font-semibold">{inr(e.amount)}</td>
                    <td className="a-td text-right">
                      <form action={deleteExpense}><input type="hidden" name="id" value={e.id} /><button className="text-xs text-red-600 hover:underline">Delete</button></form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
