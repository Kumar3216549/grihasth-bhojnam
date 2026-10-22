import { db } from "@/lib/db";
import { getDayPlan, type PlanLine } from "@/lib/kitchen";
import { dbDate, fmtDate, ymdIST } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { PageTitle } from "@/components/admin/ui";
import DateNav from "@/components/admin/DateNav";
import { saveArea, saveCompany } from "../actions";

type Stop = { key: string; companyName: string; areaName: string; address: string; areaSeq: number; routeSeq: number; count: number; paneer: number; contact: string; mapsUrl: string; gateNote: string };

export default async function RoutesPage({ searchParams }: { searchParams: { date?: string } }) {
  const today = ymdIST();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date || "") ? searchParams.date! : today;
  const [plan, areas, companies, s] = await Promise.all([
    getDayPlan(dbDate(date)),
    db.area.findMany({ orderBy: [{ routeSeq: "asc" }, { nameEn: "asc" }] }),
    db.company.findMany({ include: { area: true, _count: { select: { orders: true, subscriptions: true } } }, orderBy: [{ routeSeq: "asc" }, { name: "asc" }] }),
    getSettings(),
  ]);
  const compById = new Map(companies.map((c) => [c.id, c]));

  // one delivery run per shift, stops ordered by area sequence then company route sequence
  const runs = new Map<string, Map<string, Stop>>();
  for (const l of plan.lines as PlanLine[]) {
    const run = runs.get(l.shift) ?? new Map<string, Stop>();
    const k = l.companyId ?? l.companyName;
    const c = l.companyId ? compById.get(l.companyId) : undefined;
    const st = run.get(k) ?? {
      key: k, companyName: l.companyName, areaName: l.areaName, address: c?.address || l.address, areaSeq: l.areaSeq, routeSeq: l.routeSeq,
      count: 0, paneer: 0, contact: c?.contactPhone ? `${c.contactName} ${c.contactPhone}` : "", mapsUrl: c?.mapsUrl ?? "", gateNote: c?.gateNote ?? "",
    };
    st.count += l.veg + l.paneer;
    st.paneer += l.paneer;
    run.set(k, st);
    runs.set(l.shift, run);
  }
  const place = (st: Stop) => [st.address, st.companyName, st.areaName, s.city].filter(Boolean).join(", ");

  return (
    <div>
      <PageTitle title="Delivery Route Planner" hi="फैक्ट्री एरिया के हिसाब से डिलीवरी रूट">
        <DateNav date={date} today={today} />
      </PageTitle>

      {runs.size === 0 && <p className="a-card text-sm text-stone-500">No deliveries for {fmtDate(dbDate(date))}.</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        {[...runs.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([shift, run]) => {
          const stops = [...run.values()].sort((a, b) => a.areaSeq - b.areaSeq || a.routeSeq - b.routeSeq || a.companyName.localeCompare(b.companyName));
          const total = stops.reduce((a, x) => a + x.count, 0);
          const maps = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(s.kitchenAddress + ", " + s.city)}&destination=${encodeURIComponent(place(stops[stops.length - 1]))}&travelmode=driving${stops.length > 1 ? `&waypoints=${encodeURIComponent(stops.slice(0, -1).slice(0, 9).map(place).join("|"))}` : ""}`;
          const sheet = `🛵 Grihasth Bhojnam — ${shift} — ${date}\nTotal: ${total} tiffins\n\n` + stops.map((x, i) => `${i + 1}. ${x.companyName} (${x.areaName}) — ${x.count}${x.paneer ? ` [${x.paneer} paneer]` : ""}${x.gateNote ? `\n   Gate: ${x.gateNote}` : ""}${x.contact ? `\n   📞 ${x.contact}` : ""}`).join("\n");
          return (
            <section key={shift} className="a-card">
              <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">⏰ {shift}</h2>
                  <p className="text-sm text-stone-500">{stops.length} stops · {total} tiffins</p>
                </div>
                <div className="flex gap-2">
                  <a href={maps} target="_blank" rel="noopener" className="a-btn">🗺️ Open in Maps</a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(sheet)}`} target="_blank" rel="noopener" className="a-btn-ghost">💬 Send to rider</a>
                </div>
              </header>
              <ol className="relative space-y-3 border-l-2 border-dashed border-saffron-200 pl-5">
                <li className="text-xs text-stone-500"><span className="absolute -left-[9px] mt-0.5 h-4 w-4 rounded-full bg-leaf-600" />Start: {s.kitchenAddress}</li>
                {stops.map((x, i) => (
                  <li key={x.key} className="relative">
                    <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-saffron-500 text-xs font-bold text-white">{i + 1}</span>
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-stone-100 p-3">
                      <div>
                        <p className="font-medium">{x.companyName} <span className="text-xs text-stone-500">· {x.areaName}</span></p>
                        <p className="text-xs text-stone-500">{x.address || "Add address in Factories below"}{x.gateNote ? ` · Gate: ${x.gateNote}` : ""}</p>
                        {x.contact && <p className="text-xs">📞 {x.contact}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{x.count}</p>
                        {x.paneer > 0 && <p className="text-[10px] text-saffron-700">{x.paneer} paneer</p>}
                        <a href={x.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place(x))}`} target="_blank" rel="noopener" className="text-xs text-saffron-700 hover:underline">Map</a>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="a-card">
          <h2 className="mb-1 font-semibold">Industrial areas</h2>
          <p className="mb-3 text-xs text-stone-500">Route order: lower number is delivered first. Each active area gets its own SEO page.</p>
          <div className="space-y-2">
            {areas.map((a) => (
              <form key={a.id} action={saveArea} className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-1.5">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="city" value={a.city} />
                <input name="routeSeq" type="number" defaultValue={a.routeSeq} className="a-input !px-2 !py-1" aria-label="Route order" />
                <input name="nameEn" defaultValue={a.nameEn} className="a-input !py-1" />
                <input name="nameHi" defaultValue={a.nameHi} className="a-input !py-1 font-hindi" />
                <span className="flex items-center gap-1">
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="active" defaultChecked={a.active} />on</label>
                  <button className="a-btn-ghost !px-2 !py-1 text-xs">Save</button>
                </span>
              </form>
            ))}
            <form action={saveArea} className="grid grid-cols-[3rem_1fr_1fr_auto] gap-1.5 border-t border-stone-100 pt-3">
              <input name="routeSeq" type="number" defaultValue={areas.length + 1} className="a-input !px-2 !py-1" />
              <input name="nameEn" placeholder="New area (English)" className="a-input !py-1" required />
              <input name="nameHi" placeholder="हिंदी नाम" className="a-input !py-1 font-hindi" />
              <input type="hidden" name="city" value={s.city} />
              <button className="a-btn !py-1 text-xs">Add</button>
            </form>
          </div>
        </section>

        <section className="a-card overflow-x-auto">
          <h2 className="mb-1 font-semibold">Factories / delivery stops</h2>
          <p className="mb-3 text-xs text-stone-500">Factories are created automatically from orders. Add address, gate and contact once — the rider sees it every day.</p>
          <div className="min-w-[760px] space-y-2">
            {companies.map((c) => (
              <form key={c.id} action={saveCompany} className="grid grid-cols-[3rem_1.2fr_1fr_1.4fr_1fr_1fr_auto] items-center gap-1.5">
                <input type="hidden" name="id" value={c.id} />
                <input name="routeSeq" type="number" defaultValue={c.routeSeq} className="a-input !px-2 !py-1" aria-label="Route order" />
                <input name="name" defaultValue={c.name} className="a-input !py-1" />
                <select name="areaId" defaultValue={c.areaId ?? ""} className="a-input !py-1">
                  <option value="">—</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.nameEn}</option>)}
                </select>
                <input name="address" defaultValue={c.address} placeholder="Plot / road" className="a-input !py-1" />
                <input name="gateNote" defaultValue={c.gateNote} placeholder="Gate note" className="a-input !py-1" />
                <input name="contactPhone" defaultValue={c.contactPhone} placeholder="Contact phone" className="a-input !py-1" />
                <input type="hidden" name="contactName" value={c.contactName} />
                <input type="hidden" name="mapsUrl" value={c.mapsUrl} />
                <button className="a-btn-ghost !px-2 !py-1 text-xs">Save</button>
              </form>
            ))}
            {companies.length === 0 && <p className="text-sm text-stone-500">No factories yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
