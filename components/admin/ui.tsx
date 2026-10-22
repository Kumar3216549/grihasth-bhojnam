export function Stat({ label, value, sub, tone = "stone", icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "stone" | "saffron" | "leaf" | "red" | "amber"; icon?: string }) {
  const tones = {
    stone: "bg-white border-stone-200",
    saffron: "bg-saffron-50 border-saffron-200",
    leaf: "bg-leaf-50 border-leaf-200",
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-stone-500">{icon && <span aria-hidden>{icon}</span>}{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export function PageTitle({ title, hi, children }: { title: string; hi?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">{title}</h1>
        {hi && <p className="font-hindi text-sm text-stone-500">{hi}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Badge({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "saffron" | "leaf" | "red" | "amber" | "blue" }) {
  const t = {
    stone: "bg-stone-100 text-stone-700",
    saffron: "bg-saffron-100 text-saffron-800",
    leaf: "bg-leaf-100 text-leaf-800",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-sky-100 text-sky-800",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">⚠ {error}</p>;
  if (ok) return <p className="mb-4 rounded-lg border border-leaf-200 bg-leaf-50 px-4 py-2 text-sm text-leaf-800">✓ Saved</p>;
  return null;
}

export const statusTone = (s: string) =>
  ({ NEW: "blue", CONFIRMED: "saffron", PREPARING: "amber", OUT_FOR_DELIVERY: "saffron", DELIVERED: "leaf", CANCELLED: "red" } as const)[s] ?? "stone";

/** Simple dual bar chart (revenue vs expense) — no chart library needed */
export function BarChart({ data }: { data: { label: string; a: number; b: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end gap-[1px]" title={`${d.label}: revenue ₹${d.a}, expense ₹${d.b}`}>
            <div className="w-1/2 rounded-t bg-leaf-500" style={{ height: `${(d.a / max) * 100}%` }} />
            <div className="w-1/2 rounded-t bg-saffron-400" style={{ height: `${(d.b / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px] text-[9px] text-stone-400">
        {data.map((d, i) => <span key={d.label} className="flex-1 text-center">{i % 5 === 0 ? d.label.slice(8) : ""}</span>)}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-stone-600">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-leaf-500" />Revenue</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-saffron-400" />Expense</span>
      </div>
    </div>
  );
}
