import { db } from "@/lib/db";
import { getDayPlan } from "@/lib/kitchen";
import { todayDb, addDays } from "@/lib/dates";
import { inr, num } from "@/lib/format";
import { Badge, Flash, PageTitle, Stat } from "@/components/admin/ui";
import { deleteInventoryItem, saveInventoryItem, stockTxn } from "../actions";

export default async function InventoryPage({ searchParams }: { searchParams: { ok?: string; error?: string; edit?: string } }) {
  const today = todayDb();
  const [items, txns, plan] = await Promise.all([
    db.inventoryItem.findMany({ orderBy: { nameEn: "asc" } }),
    db.stockTxn.findMany({ orderBy: { date: "desc" }, take: 25, include: { item: true } }),
    getDayPlan(today),
  ]);
  const weekIn = await db.stockTxn.findMany({ where: { type: "IN", date: { gte: addDays(today, -7) } } });
  const stockValue = items.reduce((a, i) => a + i.stock * i.costPerUnit, 0);
  const low = items.filter((i) => i.lowStockLevel > 0 && i.stock <= i.lowStockLevel);
  const edit = items.find((i) => i.id === searchParams.edit);

  return (
    <div>
      <PageTitle title="Inventory" hi="आटा, चावल, दाल, सब्ज़ी, तेल — रोज़ का स्टॉक इन / आउट" />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Items" value={items.length} />
        <Stat tone={low.length ? "red" : "leaf"} label="Low stock" value={low.length} sub={low.map((l) => l.nameEn).join(", ") || "All good"} />
        <Stat label="Stock value" value={inr(stockValue)} />
        <Stat label="Purchases (7 days)" value={inr(weekIn.reduce((a, t) => a + t.qty * t.rate, 0))} />
      </div>

      <div className="a-card overflow-x-auto !p-0">
        <table className="w-full min-w-[980px]">
          <thead className="bg-stone-50">
            <tr><th className="a-th">Item</th><th className="a-th text-right">Stock</th><th className="a-th text-right">Today needs</th><th className="a-th text-right">Lasts</th><th className="a-th">Stock in / out</th><th className="a-th"></th></tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const need = plan.veg * i.perVegTiffin + plan.paneer * i.perPaneerTiffin;
              const lasts = need > 0 ? i.stock / need : null;
              const isLow = i.lowStockLevel > 0 && i.stock <= i.lowStockLevel;
              return (
                <tr key={i.id} className={`border-t border-stone-100 ${isLow ? "bg-red-50/60" : ""}`}>
                  <td className="a-td">
                    <p className="font-medium">{i.nameEn} <span className="font-hindi text-sm text-stone-400">{i.nameHi}</span></p>
                    <p className="text-xs text-stone-500">₹{i.costPerUnit}/{i.unit} · alert below {i.lowStockLevel} {i.unit}</p>
                  </td>
                  <td className="a-td text-right">
                    <span className="text-lg font-bold tabular-nums">{num(i.stock, 2)}</span> <span className="text-xs text-stone-500">{i.unit}</span>
                    {isLow && <div><Badge tone="red">LOW</Badge></div>}
                  </td>
                  <td className="a-td text-right tabular-nums text-sm">{num(need, 2)} {i.unit}</td>
                  <td className="a-td text-right text-sm">{lasts === null ? "—" : <span className={lasts < 1 ? "font-semibold text-red-600" : lasts < 2 ? "text-amber-700" : ""}>{num(lasts, 1)} days</span>}</td>
                  <td className="a-td">
                    <form action={stockTxn} className="flex flex-wrap items-center gap-1.5">
                      <input type="hidden" name="itemId" value={i.id} />
                      <input name="qty" type="number" step="0.01" min="0" placeholder="Qty" className="a-input !w-20 !py-1" required />
                      <input name="rate" type="number" step="0.01" min="0" placeholder="₹/unit" className="a-input !w-20 !py-1" title="Purchase rate (only for IN). Saved as expense." />
                      <input name="note" placeholder="Note" className="a-input !w-28 !py-1" />
                      <button name="type" value="IN" className="a-btn !bg-leaf-600 !py-1 hover:!bg-leaf-700">+ In</button>
                      <button name="type" value="OUT" className="a-btn-ghost !py-1">− Out</button>
                      <button name="type" value="ADJUST" className="a-btn-ghost !py-1" title="Set stock to the counted quantity">= Set</button>
                    </form>
                  </td>
                  <td className="a-td text-right"><a href={`?edit=${i.id}#item-form`} className="text-sm text-saffron-700 hover:underline">Edit</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section id="item-form" className="a-card">
          <h2 className="font-semibold">{edit ? `Edit ${edit.nameEn}` : "➕ Add item"}</h2>
          <p className="mb-3 text-xs text-stone-500">“Per tiffin” = how much one tiffin uses. This drives the tiffin calculator, stock alerts and food cost.</p>
          <form action={saveInventoryItem} className="grid grid-cols-2 gap-3 text-sm">
            <input type="hidden" name="id" value={edit?.id ?? ""} />
            <label>Name (English)<input name="nameEn" defaultValue={edit?.nameEn} className="a-input mt-1" required /></label>
            <label>नाम (हिंदी)<input name="nameHi" defaultValue={edit?.nameHi} className="a-input mt-1" /></label>
            <label>Unit<select name="unit" defaultValue={edit?.unit ?? "kg"} className="a-input mt-1">{["kg", "L", "pcs", "cylinder", "pack"].map((u) => <option key={u}>{u}</option>)}</select></label>
            <label>Cost ₹ per unit<input name="costPerUnit" type="number" step="0.01" defaultValue={edit?.costPerUnit ?? 0} className="a-input mt-1" /></label>
            <label>Per veg tiffin<input name="perVegTiffin" type="number" step="0.001" defaultValue={edit?.perVegTiffin ?? 0} className="a-input mt-1" /></label>
            <label>Per paneer tiffin<input name="perPaneerTiffin" type="number" step="0.001" defaultValue={edit?.perPaneerTiffin ?? 0} className="a-input mt-1" /></label>
            <label>Low-stock alert at<input name="lowStockLevel" type="number" step="0.01" defaultValue={edit?.lowStockLevel ?? 0} className="a-input mt-1" /></label>
            {!edit && <label>Opening stock<input name="stock" type="number" step="0.01" defaultValue={0} className="a-input mt-1" /></label>}
            <div className="col-span-2 flex gap-2">
              <button className="a-btn">{edit ? "Save changes" : "Add item"}</button>
              {edit && <a href="/admin/inventory" className="a-btn-ghost">Cancel</a>}
            </div>
          </form>
          {edit && (
            <form action={deleteInventoryItem} className="mt-3">
              <input type="hidden" name="id" value={edit.id} />
              <button className="text-xs text-red-600 hover:underline">Delete this item and its history</button>
            </form>
          )}
        </section>

        <section className="a-card">
          <h2 className="mb-3 font-semibold">Recent stock movements</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 py-1.5">
                <span><Badge tone={t.type === "IN" ? "leaf" : t.type === "OUT" ? "amber" : "stone"}>{t.type}</Badge> {t.item.nameEn} <span className="text-stone-400">{t.note}</span></span>
                <span className="whitespace-nowrap tabular-nums">{num(t.qty, 2)} {t.item.unit}{t.rate ? ` @ ₹${t.rate}` : ""}<span className="block text-right text-[10px] text-stone-400">{t.date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></span>
              </li>
            ))}
            {txns.length === 0 && <li className="py-2 text-stone-500">No movements yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
