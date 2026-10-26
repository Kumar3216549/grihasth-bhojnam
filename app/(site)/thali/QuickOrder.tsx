"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmt, type Dict } from "@/lib/i18n";

type Props = {
  lang: "hi" | "en";
  t: Dict["quick"];
  errors: Dict["order"]["errors"];
  price: number;
  today: string;
  shifts: string[];
  areas: { slug: string; nameEn: string; nameHi: string }[];
  whatsapp: string;
  dish: string;
};

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2) + Date.now().toString(36));

/** One-screen order: quantity + contact details → order with QR, or the same details as a WhatsApp message. */
export default function QuickOrder(p: Props) {
  const { t } = p;
  const router = useRouter();
  const [f, setF] = useState({ qty: 1, name: "", phone: "", company: "", address: "", shift: p.shifts[0] || "", areaSlug: p.areas[0]?.slug || "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(0);
  const [serverErr, setServerErr] = useState("");
  const key = useRef("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("gb_customer") || "null");
      if (s) setF((x) => ({ ...x, name: s.name || "", phone: s.phone || "", company: s.company || "", address: s.address || "" }));
    } catch {}
  }, []);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    key.current = "";
    setF((x) => ({ ...x, [k]: v }));
  };

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = p.errors.required;
    if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = p.errors.mobile;
    if (f.company.trim().length < 2) e.company = p.errors.required;
    setErrs(e);
    return !Object.keys(e).length;
  }

  async function confirm() {
    if (busy || !validate()) return;
    setBusy(true);
    setServerErr("");
    if (!key.current) key.current = newKey();
    try {
      localStorage.setItem("gb_customer", JSON.stringify({ name: f.name, phone: f.phone, company: f.company, address: f.address }));
    } catch {}
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name, phone: f.phone, company: f.company, areaSlug: f.areaSlug, areaOther: f.areaSlug ? "" : "Other",
          shift: f.shift, planType: "DAILY", thaliType: "VEG", qty: f.qty, date: p.today, address: f.address,
          notes: "Quick order (QR)", paymentMethod: "COD", clientKey: key.current,
        }),
      }).catch(() => null);
      if (!res) throw new Error(p.errors.network);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(p.errors[(data.code || "generic") as keyof typeof p.errors] || p.errors.generic);
      router.push(`/order/success/${data.token}`);
    } catch (e) {
      setServerErr((e as Error).message);
      setBusy(false);
    }
  }

  const waText = fmt(t.waTemplate, {
    msg: fmt(t.waPick[msg], { qty: f.qty }),
    name: f.name || "-",
    qty: f.qty,
    company: f.company || "-",
    address: f.address || "-",
    time: f.shift || "-",
  });
  const E = ({ k }: { k: string }) => (errs[k] ? <p className="mt-1 text-xs text-red-600" role="alert">{errs[k]}</p> : null);

  return (
    <div className="mt-5 space-y-5">
      <div className="card space-y-4 p-5">
        <div>
          <span className="label">{t.qty}</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label={t.less} className="btn-ghost h-12 w-12 !p-0 text-2xl" onClick={() => set("qty", Math.max(1, f.qty - 1))}>−</button>
            <output className="w-14 text-center text-3xl font-extrabold" aria-live="polite">{f.qty}</output>
            <button type="button" aria-label={t.more} className="btn-ghost h-12 w-12 !p-0 text-2xl" onClick={() => set("qty", Math.min(50, f.qty + 1))}>+</button>
            <p className="ml-auto text-right">
              <span className="block text-xs text-ink/60">{t.total}</span>
              <span className="text-2xl font-extrabold">₹{(p.price * f.qty).toLocaleString("en-IN")}</span>
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="q-name">{t.name}</label>
            <input id="q-name" className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
            <E k="name" />
          </div>
          <div>
            <label className="label" htmlFor="q-phone">{t.phone}</label>
            <input id="q-phone" className="input" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
            <E k="phone" />
          </div>
          <div>
            <label className="label" htmlFor="q-company">{t.company}</label>
            <input id="q-company" className="input" autoComplete="organization" value={f.company} onChange={(e) => set("company", e.target.value)} />
            <E k="company" />
          </div>
          <div>
            <label className="label" htmlFor="q-time">{t.time}</label>
            <select id="q-time" className="input" value={f.shift} onChange={(e) => set("shift", e.target.value)}>
              {p.shifts.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="q-address">{t.address}</label>
            <input id="q-address" className="input" value={f.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          {p.areas.length > 0 && (
            <div className="sm:col-span-2">
              <select aria-label={t.address} className="input" value={f.areaSlug} onChange={(e) => set("areaSlug", e.target.value)}>
                {p.areas.map((a) => <option key={a.slug} value={a.slug}>{p.lang === "hi" ? a.nameHi : a.nameEn}</option>)}
              </select>
            </div>
          )}
        </div>
        <p className="text-xs text-ink/60">💵 {t.payNote}</p>
        {serverErr && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverErr}</p>}
        <button type="button" className="btn-primary w-full !py-4 text-base" disabled={busy} aria-busy={busy} onClick={confirm}>
          {busy ? "…" : `✓ ${t.confirm} · ₹${(p.price * f.qty).toLocaleString("en-IN")}`}
        </button>
      </div>

      <div className="card p-5">
        <p className="font-bold text-earth-800">💬 {t.waTitle}</p>
        <p className="mt-1 text-sm text-ink/70">{t.waSub}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t.waTitle}>
          {t.waPick.map((m, i) => (
            <button key={m} type="button" role="radio" aria-checked={msg === i} onClick={() => setMsg(i)}
              className={`rounded-full border-2 px-3 py-1.5 text-sm ${msg === i ? "border-leaf-600 bg-leaf-50 text-leaf-900" : "border-earth-100 bg-white"}`}>
              {fmt(m, { qty: f.qty })}
            </button>
          ))}
        </div>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-cream p-3 font-sans text-sm text-ink/80">{waText}</pre>
        <a className="btn-green mt-3 w-full" target="_blank" rel="noopener" href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(waText)}`}>
          {t.waSend}
        </a>
      </div>
    </div>
  );
}
