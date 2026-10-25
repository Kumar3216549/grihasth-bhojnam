"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmt, type Dict } from "@/lib/i18n";

type Props = {
  t: Dict["success"]["upi"];
  token: string;
  amount: number;
  orderNo: string;
  upiId: string;
  payee: string;
  qrUrl: string;
  existingRef: string | null;
};

/** Shows the owner's UPI ID / QR and collects the customer's transaction reference. Never marks anything as paid. */
export default function UpiPayPanel({ t, token, amount, orderNo, upiId, payee, qrUrl, existingRef }: Props) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [saved, setSaved] = useState(existingRef);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const upiLink = upiId
    ? `upi://pay?${new URLSearchParams({ pa: upiId, pn: payee, am: String(amount), cu: "INR", tn: `Order ${orderNo}` }).toString()}`
    : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const v = ref.replace(/\s/g, "");
    if (!/^[A-Za-z0-9]{6,30}$/.test(v)) return setErr(t.refInvalid);
    setErr("");
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${token}/upi-ref`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: v }) });
      if (!res.ok) throw new Error();
      setSaved(v.toUpperCase());
      router.refresh();
    } catch {
      setErr(t.refInvalid);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mt-8 space-y-5 p-5 text-left sm:p-7">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-2 text-sm">
          <p><span className="text-ink/60">{t.payTo}: </span><span className="font-semibold">{payee}</span></p>
          {upiId && (
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-ink/60">{t.upiId}: </span>
              <code className="rounded-lg bg-saffron-50 px-2 py-1 font-mono text-base font-bold text-earth-800">{upiId}</code>
              <button
                type="button"
                className="btn-ghost !px-3 !py-1 text-xs"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
                }}
              >
                {copied ? t.copied : t.copy}
              </button>
            </p>
          )}
          <p className="text-2xl font-extrabold">₹{amount.toLocaleString("en-IN")}</p>
        </div>
        {qrUrl && (
          <figure className="mx-auto w-44 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt={t.qrAlt} className="h-44 w-44 rounded-xl border border-earth-100 bg-white object-contain p-2" />
            <figcaption className="mt-1 text-xs text-ink/60">{t.scan}</figcaption>
          </figure>
        )}
      </div>

      {upiLink && (
        <a href={upiLink} className="btn-green w-full sm:hidden">{fmt(t.openApp, { amount: amount.toLocaleString("en-IN") })}</a>
      )}

      <ol className="list-decimal space-y-1 pl-5 text-sm text-ink/80">
        {t.steps.map((s) => <li key={s}>{fmt(s, { amount: amount.toLocaleString("en-IN"), orderNo })}</li>)}
      </ol>

      {saved ? (
        <p className="rounded-xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-900" role="status">✓ {fmt(t.refSaved, { ref: saved })}</p>
      ) : null}
      <form onSubmit={submit} noValidate className="space-y-2">
        <label className="label" htmlFor="upi-ref">{t.refLabel}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="upi-ref" className="input" inputMode="text" autoComplete="off" maxLength={40} placeholder={t.refPh} value={ref} onChange={(e) => setRef(e.target.value)} aria-invalid={Boolean(err)} aria-describedby="upi-ref-note" />
          <button className="btn-primary whitespace-nowrap" disabled={busy}>{t.refSubmit}</button>
        </div>
        {err && <p className="text-sm text-red-700" role="alert">{err}</p>}
        <p id="upi-ref-note" className="text-xs text-ink/60">{t.refNote}</p>
      </form>
    </div>
  );
}
