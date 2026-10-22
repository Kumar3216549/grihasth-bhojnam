import { db, type SubStatus } from "@/lib/db";
import { daysBetween, dbDate, fmtDate, todayDb, ymdIST } from "@/lib/dates";
import { inr, waLink } from "@/lib/format";
import { getSettings, prices } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";
import { Badge, PageTitle, Stat } from "@/components/admin/ui";
import { expireSubscriptions, subscriptionAction } from "../actions";

const TABS: { key: string; label: string; where: SubStatus[] }[] = [
  { key: "active", label: "Active", where: ["ACTIVE"] },
  { key: "paused", label: "Paused", where: ["PAUSED"] },
  { key: "pending", label: "Payment pending", where: ["PENDING_PAYMENT"] },
  { key: "expired", label: "Expired", where: ["EXPIRED", "CANCELLED"] },
];

export default async function SubscribersPage({ searchParams }: { searchParams: { tab?: string } }) {
  await expireSubscriptions();
  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const today = todayDb();
  const s = await getSettings();
  const p = prices(s);
  const [subs, counts] = await Promise.all([
    db.subscription.findMany({
      where: { status: { in: tab.where } },
      include: { customer: true, company: { include: { area: true } } },
      orderBy: tab.key === "expired" ? { endDate: "desc" } : { endDate: "asc" },
      take: 300,
    }),
    db.subscription.groupBy({ by: ["status"], _count: true, _sum: { qty: true, amount: true } }),
  ]);
  const c = (st: SubStatus) => counts.find((x) => x.status === st);
  const expiringSoon = subs.filter((x) => x.status === "ACTIVE" && daysBetween(today, x.endDate) <= 3).length;

  return (
    <div>
      <PageTitle title="Monthly Subscribers" hi="मंथली ग्राहक — एक्सपायरी रिमाइंडर के साथ" />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat tone="leaf" label="Active plans" value={c("ACTIVE")?._count ?? 0} sub={`${c("ACTIVE")?._sum.qty ?? 0} tiffins / day`} />
        <Stat tone={expiringSoon ? "amber" : "stone"} label="Expiring ≤ 3 days" value={tab.key === "active" ? expiringSoon : "—"} />
        <Stat label="Monthly recurring" value={inr((c("ACTIVE")?._sum.amount ?? 0))} sub="if all renew" />
        <Stat label="Plan price" value={inr(p.monthly)} sub={`${p.days} working days`} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <a key={t.key} href={`?tab=${t.key}`} className={`rounded-full px-3 py-1.5 text-sm ${t.key === tab.key ? "bg-saffron-500 font-semibold text-white" : "border border-stone-200 bg-white"}`}>
            {t.label} ({t.where.reduce((a, st) => a + (c(st)?._count ?? 0), 0)})
          </a>
        ))}
      </div>

      <div className="a-card overflow-x-auto !p-0">
        <table className="w-full min-w-[860px]">
          <thead className="bg-stone-50"><tr><th className="a-th">Customer</th><th className="a-th">Factory</th><th className="a-th">Shift</th><th className="a-th">Tiffins</th><th className="a-th">Period</th><th className="a-th">Left</th><th className="a-th text-right">Actions</th></tr></thead>
          <tbody>
            {subs.map((sb) => {
              const left = daysBetween(today, sb.endDate);
              const msg = `Namaste ${sb.customer.name} 🙏\nAapka Grihasth Bhojnam monthly tiffin plan ${fmtDate(sb.endDate)} ko khatam ho raha hai.\nRenew karein sirf ₹${p.monthly} me: ${SITE_URL}/order?plan=MONTHLY\n– व्यापार नहीं, व्यवहार परोसते हैं हम।`;
              return (
                <tr key={sb.id} className={`border-t border-stone-100 ${sb.status === "ACTIVE" && left <= 3 ? "bg-amber-50/60" : ""}`}>
                  <td className="a-td"><p className="font-medium">{sb.customer.name}</p><a href={`tel:${sb.customer.phone}`} className="text-xs text-stone-500">{sb.customer.phone}</a></td>
                  <td className="a-td">{sb.company?.name}<p className="text-xs text-stone-500">{sb.company?.area?.nameEn}</p></td>
                  <td className="a-td text-xs">{sb.shift}</td>
                  <td className="a-td">{sb.qty}</td>
                  <td className="a-td text-xs">{fmtDate(sb.startDate)} → {fmtDate(sb.endDate)}</td>
                  <td className="a-td">
                    {sb.status === "ACTIVE" ? (
                      <Badge tone={left <= 0 ? "red" : left <= 3 ? "amber" : "leaf"}>{left < 0 ? "ended" : `${left} days`}</Badge>
                    ) : <Badge>{sb.status}</Badge>}
                    {sb.remindedAt && <p className="mt-1 text-[10px] text-stone-400">reminded {fmtDate(dbDate(ymdIST(sb.remindedAt)))}</p>}
                  </td>
                  <td className="a-td">
                    <form action={subscriptionAction} className="flex flex-wrap items-center justify-end gap-1.5">
                      <input type="hidden" name="id" value={sb.id} />
                      <a href={waLink(sb.customer.phone, msg)} target="_blank" rel="noopener" className="a-btn-ghost !py-1 text-xs">💬 Remind</a>
                      <button name="action" value="remind" className="a-btn-ghost !py-1 text-xs" title="Send via WhatsApp Cloud API">📲 Auto</button>
                      {sb.status === "ACTIVE" && <>
                        <input name="days" type="number" min={1} defaultValue={1} className="a-input !w-14 !py-1 text-xs" aria-label="Days" />
                        <button name="action" value="extend" className="a-btn-ghost !py-1 text-xs" title="Add working days (holiday / compensation)">+ days</button>
                        <button name="action" value="pause" className="a-btn-ghost !py-1 text-xs">⏸</button>
                      </>}
                      {sb.status === "PAUSED" && <button name="action" value="resume" className="a-btn-ghost !py-1 text-xs">▶ Resume</button>}
                      {sb.status === "PENDING_PAYMENT" && <button name="action" value="activate" className="a-btn !py-1 text-xs" title="Payment received offline">Mark paid</button>}
                      {sb.status !== "CANCELLED" && sb.status !== "EXPIRED" && <button name="action" value="cancel" className="a-btn-ghost !py-1 text-xs text-red-600">✕</button>}
                    </form>
                  </td>
                </tr>
              );
            })}
            {subs.length === 0 && <tr><td colSpan={7} className="a-td py-8 text-center text-stone-500">No subscribers here yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-500">Rows in yellow expire within 3 days. “💬 Remind” opens WhatsApp with a ready message; “📲 Auto” sends via WhatsApp Cloud API (needs an approved template). Pause a plan during factory shutdowns, then use “+ days” to add the missed days.</p>
    </div>
  );
}
