"use client";
import { useEffect, useMemo, useState } from "react";
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
  onlineEnabled: boolean;
  demo: boolean;
  whatsapp: string;
};

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const weekdayOf = (ymd: string) => new Date(ymd + "T00:00:00Z").getUTCDay();
const nextOpenDay = (ymd: string) => {
  const d = new Date(ymd + "T00:00:00Z");
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

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
    paymentMethod: (props.defaultPlan === "MONTHLY" ? "ONLINE" : "COD") as "COD" | "ONLINE",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  // restore last details (name/phone/company) for repeat customers
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("gb_customer") || "null");
      if (saved) setF((x) => ({ ...x, name: saved.name || "", phone: saved.phone || "", company: saved.company || "", address: saved.address || "" }));
    } catch {}
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const isPaneerDay = props.paneerDates.includes(f.date);
  const isSunday = weekdayOf(f.date) === 0;

  useEffect(() => {
    if (f.planType === "MONTHLY") setF((x) => ({ ...x, paymentMethod: "ONLINE", thaliType: "VEG" }));
  }, [f.planType]);
  useEffect(() => {
    if (!isPaneerDay && f.thaliType === "PANEER") setF((x) => ({ ...x, thaliType: "VEG" }));
  }, [isPaneerDay, f.thaliType]);

  const unit = f.planType === "MONTHLY" ? props.prices.monthly : f.thaliType === "PANEER" ? props.prices.paneer : props.prices.daily;
  const total = useMemo(() => unit * (Number(f.qty) || 0), [unit, f.qty]);

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = t.errors.required;
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, "").slice(-10))) e.phone = t.errors.mobile;
    if (f.company.trim().length < 2) e.company = t.errors.required;
    if (f.areaSlug === "__other" && f.areaOther.trim().length < 2) e.areaOther = t.errors.required;
    if (!f.date || isSunday) e.date = lang === "hi" ? "रविवार को रसोई बंद है" : "Kitchen is closed on Sunday";
    if (!(Number(f.qty) >= 1)) e.qty = t.errors.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      localStorage.setItem("gb_customer", JSON.stringify({ name: f.name, phone: f.phone, company: f.company, address: f.address }));
    } catch {}
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, areaSlug: f.areaSlug === "__other" ? "" : f.areaSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errors.generic);

      if (f.paymentMethod === "COD") return router.push(`/order/success/${data.token}`);

      if (data.demo) {
        const ok = window.confirm(`DEMO PAYMENT (test mode)\nPay ₹${data.amount}?`);
        if (ok) await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: data.token, demo: true }) });
        return router.push(`/order/success/${data.token}`);
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Could not load payment window. Check internet and try again.");
      const r = data.razorpay;
      const rp = new window.Razorpay({
        key: r.key,
        order_id: r.orderId,
        amount: r.amount,
        currency: "INR",
        name: r.name,
        description: r.description,
        image: "/icons/icon-192.png",
        prefill: r.prefill,
        theme: { color: "#F28C28" },
        handler: async (resp: Record<string, string>) => {
          await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: data.token, ...resp }) });
          router.push(`/order/success/${data.token}`);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rp.on("payment.failed", () => setServerError(lang === "hi" ? "पेमेंट फेल हुआ। दोबारा कोशिश करें।" : "Payment failed. Please try again."));
      rp.open();
    } catch (err) {
      setServerError((err as Error).message || t.errors.generic);
      setBusy(false);
    }
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs font-medium text-red-600">{errors[k]}</p> : null);
  const Seg = <T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string; sub?: string; disabled?: boolean }[]; onChange: (v: T) => void }) => (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.v}
          disabled={o.disabled}
          onClick={() => onChange(o.v)}
          className={`rounded-xl border-2 px-3 py-3 text-left transition disabled:opacity-40 ${value === o.v ? "border-saffron-500 bg-saffron-50" : "border-saffron-100 bg-white hover:border-saffron-300"}`}
          aria-pressed={value === o.v}
        >
          <span className="block text-sm font-semibold">{o.label}</span>
          {o.sub && <span className="block text-xs text-ink/60">{o.sub}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="card mt-6 space-y-5 p-5 sm:p-7">
      <div>
        <span className="label">{t.plan}</span>
        <Seg
          value={f.planType}
          onChange={(v) => set("planType", v)}
          options={[
            { v: "DAILY", label: lang === "hi" ? "डेली" : "Daily", sub: `₹${props.prices.daily} / tiffin` },
            { v: "MONTHLY", label: lang === "hi" ? "मंथली" : "Monthly", sub: `₹${props.prices.monthly} / month` },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">{t.name}</label>
          <input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
          <Err k="name" />
        </div>
        <div>
          <label className="label" htmlFor="phone">{t.mobile}</label>
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-saffron-200 bg-saffron-50 px-3 text-sm">+91</span>
            <input id="phone" className="input !rounded-l-none" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </div>
          <Err k="phone" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company">{t.company}</label>
          <input id="company" className="input" autoComplete="organization" value={f.company} onChange={(e) => set("company", e.target.value)} />
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
            <input className="input mt-2" placeholder={t.areaOtherPh} value={f.areaOther} onChange={(e) => set("areaOther", e.target.value)} />
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
          <input id="date" type="date" className="input" min={props.today} value={f.date} onChange={(e) => set("date", e.target.value)} />
          <Err k="date" />
        </div>
        <div>
          <label className="label" htmlFor="qty">{t.qty}</label>
          <input id="qty" type="number" min={1} max={500} className="input" value={f.qty} onChange={(e) => set("qty", Math.max(1, Number(e.target.value) || 1))} />
          <p className="mt-1 text-xs text-ink/50">{t.qtyHint}</p>
        </div>
      </div>

      {f.planType === "DAILY" && (
        <div>
          <span className="label">{t.thali}</span>
          <Seg
            value={f.thaliType}
            onChange={(v) => set("thaliType", v)}
            options={[
              { v: "VEG", label: t.veg, sub: `₹${props.prices.daily}` },
              { v: "PANEER", label: `⭐ ${t.paneer}`, sub: isPaneerDay ? `₹${props.prices.paneer}` : t.paneerOnlyOn, disabled: !isPaneerDay },
            ]}
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="address">{t.address}</label>
        <input id="address" className="input" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder={lang === "hi" ? "जैसे: प्लॉट 42, गेट नं. 2" : "e.g. Plot 42, Gate no. 2"} />
      </div>

      <div>
        <span className="label">{t.payment}</span>
        {f.planType === "MONTHLY" ? (
          <p className="rounded-xl bg-leaf-50 p-3 text-sm text-leaf-900">💳 {t.monthlyOnline}</p>
        ) : (
          <Seg
            value={f.paymentMethod}
            onChange={(v) => set("paymentMethod", v)}
            options={[
              { v: "COD", label: `💵 ${t.cod}` },
              { v: "ONLINE", label: `📱 ${t.online}`, disabled: !props.onlineEnabled },
            ]}
          />
        )}
        {props.demo && <p className="mt-2 text-xs text-amber-700">⚠ Test mode: online payments are simulated (PAYMENT_DEMO_MODE).</p>}
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-medium text-ink/70">{t.notes}</summary>
        <textarea className="input mt-2" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
      </details>

      {serverError && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {serverError}{" "}
          <a className="font-semibold underline" href={`https://wa.me/${props.whatsapp}`}>WhatsApp</a>
        </p>
      )}

      <div className="flex flex-col items-stretch gap-4 border-t border-saffron-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink/60">{t.total}</p>
          <p className="text-3xl font-extrabold">₹{total.toLocaleString("en-IN")}</p>
          <p className="text-xs text-ink/50">₹{unit} × {f.qty}</p>
        </div>
        <button type="submit" disabled={busy || (f.planType === "MONTHLY" && !props.onlineEnabled)} className="btn-primary px-8 py-4 text-base">
          {busy ? t.processing : f.paymentMethod === "ONLINE" ? fmt(t.payNow, { amount: total.toLocaleString("en-IN") }) : t.submit}
        </button>
      </div>
      {f.planType === "MONTHLY" && !props.onlineEnabled && (
        <p className="text-sm text-amber-700">Online payment is not set up yet — please WhatsApp us to start a monthly plan.</p>
      )}
    </form>
  );
}
