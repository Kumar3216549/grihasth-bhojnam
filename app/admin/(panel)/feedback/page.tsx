import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { deleteFeedback } from "../actions";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const rows = await db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []);
  const rated = rows.filter((r) => r.rating);
  const avg = rated.length ? (rated.reduce((a, r) => a + (r.rating ?? 0), 0) / rated.length).toFixed(1) : "—";
  return (
    <div>
      <PageTitle title="Customer Feedback" hi={`ग्राहकों की राय · औसत रेटिंग ${avg} ★ (${rated.length})`} />
      {rows.length === 0 && <p className="a-card text-sm text-stone-500">No feedback yet. The form is on the home page (#feedback).</p>}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="a-card">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold">{r.name || "Anonymous"} {r.rating ? <span className="text-saffron-600">{"★".repeat(r.rating)}<span className="text-stone-300">{"★".repeat(5 - r.rating)}</span></span> : null}</span>
              <span className="flex items-center gap-2 text-xs text-stone-500">
                {r.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {r.lang.toUpperCase()}
                <form action={deleteFeedback}><input type="hidden" name="id" value={r.id} /><button className="a-btn-ghost !px-2 !py-0.5 text-xs" title="Delete">🗑</button></form>
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{r.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
