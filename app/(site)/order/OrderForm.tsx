"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmt, type Dict } from "@/lib/i18n";

type Props = {
  lang: "hi" | "en";
  t: Dict["order"];
  areas: { slug: string; nameEn: string; nameHi: string }[];
  shifts: string[];
  prices: { daily: number; paneer: number; monthly: number };
  paneerDates: string[];
  today: string;
  defaultPlan: "DAILY" | "MONTHLY";
  defaultArea: string;
  upiEnabled: boolean;
  whatsapp: string;
  /** Five fixed categories + the two included packing items, already in the right language */
  menuItems: string[];
  includedItems: string[];
};

type Pay = "COD" | "UPI";

const weekdayOf = (ymd: string) => new Date(ymd + "T00:00:00Z").getUTCDay();
const nextOpenDay = (ymd: string) => {
  const d = new Date(ymd + "T00:00:00Z");
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function OrderForm(props: Props) {
  const { t, lang } = props;
  const router = useRouter();
  const [f, setF] = useState({
    name: "",
    phone: "",
    company: "",
    areaSlug: props.defaultArea || props.areas[0]?.slug || "__other",
    areaOther: "",
    shift: props.shifts[0] || "",
    planType: props.defaultPlan,
    thaliType: "VEG" as "VEG" | "PANEER",
    qty: 1,
    date: nextOpenDay(props.today),
    address: "",
    notes: "",
    paymentMethod: (props.defaultPlan === "MONTHLY" && props.upiEnabled ? "UPI" : "COD") as Pay,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  // one key per filled form: a double click or a retry after a network error never books twice
  const clientKey = useRef<string>("");

  // restore last details (name/phone/company) for repeat customers
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("gb_customer") || "null");
      if (saved) setF((x) => ({ ...x, name: saved.name || "", phone: saved.phone || "", company: saved.company || "", address: saved.address || "" }));
    } catch {}
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    clientKey.current = ""; // details changed → this is a new order
    setF((x) => ({ ...x, [k]: v }));
  };
  const isPaneerDay = props.paneerDates.includes(f.date);
  const isSunday = weekdayOf(f.date) === 0;
  const monthly = f.planType === "MONTHLY";

  useEffect(() => {
    if (f.planType === "MONTHLY") setF((x) => ({ ...x, paymentMethod: "UPI", thaliType: "VEG" }));
    else if (!props.upiEnabled) setF((x) => ({ ...x, paymentMethod: "COD" }));
  }, [f.planType, props.upiEnabled]);
  useEffect(() => {
    if (!isPaneerDay && f.thaliType === "PANEER") setF((x) => ({ ...x, thaliType: "VEG" }));
  }, [isPaneerDay, f.thaliType]);

  const unit = monthly ? props.prices.monthly : f.thaliType === "PANEER" ? props.prices.paneer : props.prices.daily;
  const total = useMemo(() => unit * (Number(f.qty) || 0), [unit, f.qty]);
  const blocked = monthly && !props.upiEnabled;

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = t.errors.required;
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, "").slice(-10))) e.phone = t.errors.mobile;
    if (f.company.trim().length < 2) e.company = t.errors.required;
    if (f.areaSlug === "__other" && f.areaOther.trim().length < 2) e.areaOther = t.errors.required;
    if (!f.date) e.date = t.errors.required;
    else if (isSunday) e.date = t.errors.sunday;
    if (!(Number(f.qty) >= 1)) e.qty = t.errors.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy || blocked) return;
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    if (!clientKey.current) clientKey.current = newKey();
    try {
      localStorage.setItem("gb_customer", JSON.stringify({ name: f.name, phone: f.phone, company: f.company, address: f.address }));
    } catch {}
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, areaSlug: f.areaSlug === "__other" ? "" : f.areaSlug, clientKey: clientKey.current }),
      }).catch(() => null);
      if (!res) throw new Error(t.errors.network);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        const code = (data.code || "generic") as keyof typeof t.errors;
        throw new Error(t.errors[code] || t.errors.generic);
      }
      router.push(`/order/success/${data.token}`);
    } catch (err) {
      setServerError((err as Error).message || t.errors.generic);
      setBusy(false);
    }
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs font-medium text-red-600" role="alert">{errors[k]}</p> : null);
  const Seg = <T extends string>({ value, options, onChange, label }: { value: T; label: string; options: { v: T; label: string; sub?: string; disabled?: boolean }[]; onChange: (v: T) => void }) => (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          disabled={o.disabled}
          onClick={() => onChange(o.v)}
          className={`rounded-xl border-2 px-3 py-3 text-left transition disabled:opacity-40 ${value === o.v ? "border-saffron-500 bg-saffron-50" : "border-earth-100 bg-white hover:border-saffron-300"}`}
        >
          <span className="block text-sm font-semibold">{o.label}</span>
          {o.sub && <span className="block text-xs text-ink/60">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
  const money = (n: number) => n.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN");

  return (
    <form onSubmit={submit} noValidate className="card mt-6 space-y-5 p-5 sm:p-7">
      <div>
        <span className="label">{t.plan}</span>
        <Seg
          label={t.plan}
          value={f.planType}
          onChange={(v) => set("planType", v)}
          options={[
            { v: "DAILY", label: t.daily, sub: `₹${props.prices.daily} ${t.perTiffin}` },
            { v: "MONTHLY", label: t.monthly, sub: `₹${money(props.prices.monthly)} ${t.perMonth}` },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">{t.name}</label>
          <input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={Boolean(errors.name)} />
          <Err k="name" />
        </div>
        <div>
          <label className="label" htmlFor="phone">{t.mobile}</label>
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-earth-200 bg-saffron-50 px-3 text-sm">+91</span>
            <input id="phone" className="input !rounded-l-none" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} aria-invalid={Boolean(errors.phone)} />
          </div>
          <Err k="phone" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company">{t.company}</label>
          <input id="company" className="input" autoComplete="organization" value={f.company} onChange={(e) => set("company", e.target.value)} aria-invalid={Boolean(errors.company)} />
          <Err k="company" />
        </div>
        <div>
          <label className="label" htmlFor="area">{t.area}</label>
          <select id="area" className="input" value={f.areaSlug} onChange={(e) => set("areaSlug", e.target.value)}>
            {props.areas.map((a) => (
              <option key={a.slug} value={a.slug}>{lang === "hi" ? a.nameHi : a.nameEn}</option>
            ))}
            <option value="__other">{t.areaOther}</option>
          </select>
          {f.areaSlug === "__other" && (
            <input className="input mt-2" aria-label={t.areaOther} placeholder={t.areaOtherPh} value={f.areaOther} onChange={(e) => set("areaOther", e.target.value)} />
          )}
          <Err k="areaOther" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="shift">{t.shift}</label>
          <select id="shift" className="input" value={f.shift} onChange={(e) => set("shift", e.target.value)}>
            {props.shifts.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">{t.date}</label>
          <input id="date" type="date" lang={lang === "hi" ? "hi-IN" : "en-IN"} className="input" min={props.today} value={f.date} onChange={(e) => set("date", e.target.value)} aria-invalid={Boolean(errors.date)} />
          <Err k="date" />
        </div>
        <div>
          <label className="label" htmlFor="qty">{t.qty}</label>
          <input id="qty" type="number" min={1} max={500} className="input" value={f.qty} onChange={(e) => set("qty", Math.max(1, Math.min(500, Number(e.target.value) || 1)))} aria-describedby="qty-hint" />
          <p id="qty-hint" className="mt-1 text-xs text-ink/50">{t.qtyHint}</p>
        </div>
      </div>

      {!monthly && (
        <div>
          <span className="label">{t.thali}</span>
          <Seg
            label={t.thali}
            value={f.thaliType}
            onChange={(v) => set("thaliType", v)}
            options={[
              { v: "VEG", label: t.veg, sub: `₹${props.prices.daily}` },
              { v: "PANEER", label: t.paneer, sub: isPaneerDay ? `₹${props.prices.paneer}` : t.paneerOnlyOn, disabled: !isPaneerDay },
            ]}
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="address">{t.address}</label>
        <input id="address" className="input" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder={t.addressPh} />
      </div>

      <div>
        <span className="label">{t.payment}</span>
        {monthly ? (
          <p className={`rounded-xl p-3 text-sm ${props.upiEnabled ? "bg-leaf-50 text-leaf-900" : "bg-amber-50 text-amber-900"}`}>
            📱 {props.upiEnabled ? t.monthlyPrepaid : t.monthlyNoUpi}
          </p>
        ) : (
          <>
            <Seg
              label={t.payment}
              value={f.paymentMethod}
              onChange={(v) => set("paymentMethod", v)}
              options={[
                { v: "UPI", label: `📱 ${t.prepaid}`, sub: t.prepaidSub, disabled: !props.upiEnabled },
                { v: "COD", label: `💵 ${t.codPre}`, sub: t.codPreSub },
              ]}
            />
            <p className="mt-2 text-xs text-ink/65">
              {!props.upiEnabled ? t.upiNotReady : f.paymentMethod === "COD" ? t.codNote : t.upiNote}
            </p>
          </>
        )}
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-medium text-ink/70">{t.notes}</summary>
        <textarea className="input mt-2" rows={2} maxLength={300} aria-label={t.notes} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
      </details>

      {/* ORDER SUMMARY */}
      <section className="rounded-2xl border border-dashed border-saffron-300 bg-cream/70 p-4" aria-labelledby="sum-title">
        <h2 id="sum-title" className="text-sm font-bold uppercase tracking-wider text-saffron-800">{t.summary}</h2>
        <p className="mt-2 text-sm font-semibold">
          {monthly ? t.monthly : `${t.daily} · ${f.thaliType === "PANEER" ? t.paneer : t.veg}`} × {f.qty}
        </p>
        <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm text-ink/75 sm:grid-cols-2">
          {props.menuItems.map((m) => <li key={m}>• {m}</li>)}
        </ul>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-leaf-800">{t.includes}</p>
        <ul className="mt-1 flex flex-wrap gap-2 text-sm">
          {props.includedItems.map((m) => <li key={m} className="chip bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200">✓ {m}</li>)}
        </ul>
        <p className="mt-3 text-sm">
          <span className="text-ink/60">{t.paymentShort}: </span>
          <span className="font-semibold">{f.paymentMethod === "UPI" ? t.prepaid : t.codPre}</span>
        </p>
      </section>

      {serverError && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {serverError}{" "}
          <a className="font-semibold underline" href={`https://wa.me/${props.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a>
        </p>
      )}

      <div className="flex flex-col items-stretch gap-4 border-t border-earth-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink/60">{t.total}</p>
          <p className="text-3xl font-extrabold">₹{money(total)}</p>
          <p className="text-xs text-ink/50">{fmt(t.unitLine, { unit: money(unit), qty: f.qty })}</p>
        </div>
        <button type="submit" disabled={busy || blocked} aria-busy={busy} className="btn-primary px-8 py-4 text-base">
          {busy ? t.processing : f.paymentMethod === "UPI" ? t.submitPrepaid : t.submitCod}
        </button>
      </div>
    </form>
  );
}
