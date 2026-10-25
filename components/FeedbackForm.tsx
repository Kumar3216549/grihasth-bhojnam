"use client";
import { useRef, useState } from "react";
import { fmt, type Dict } from "@/lib/i18n";

/** Customer feedback. Stored in the database (Feedback table), read by the owner at /admin/feedback. */
export default function FeedbackForm({ t, lang }: { t: Dict["feedback"]; lang: "hi" | "en" }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const started = useRef(Date.now());
  const hp = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError("");
    const m = message.trim();
    if (m.length < 10) return setError(t.errors.message);
    if (m.length > 1000) return setError(t.errors.long);
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rating: rating || null, message: m, lang, website: hp.current?.value || "", elapsed: Date.now() - started.current }),
      });
      if (res.status === 429) throw new Error(t.errors.rate);
      if (!res.ok) throw new Error(t.errors.generic);
      setState("done");
    } catch (err) {
      setError((err as Error).message || t.errors.generic);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card flex h-full flex-col items-center justify-center p-8 text-center" role="status">
        <span className="text-5xl" aria-hidden>🙏</span>
        <p className="mt-4 text-lg font-semibold text-leaf-800">{t.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-6 sm:p-8" aria-labelledby="fb-title">
      <div>
        <h2 id="fb-title" className="h-section">{t.title}</h2>
        <p className="mt-2 text-ink/70">{t.sub}</p>
      </div>
      <div>
        <label className="label" htmlFor="fb-name">{t.name}</label>
        <input id="fb-name" className="input" maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <fieldset>
        <legend className="label">{t.rating}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={fmt(t.ratingLabel, { n })}
              onClick={() => setRating(rating === n ? 0 : n)}
              className={`text-3xl leading-none transition ${n <= rating ? "text-saffron-500" : "text-earth-200 hover:text-saffron-300"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="fb-msg">{t.message}</label>
        <textarea id="fb-msg" className="input" rows={4} maxLength={1000} placeholder={t.messagePh} value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "fb-err" : undefined} />
      </div>
      {/* honeypot: hidden from people, bots fill it */}
      <input ref={hp} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p id="fb-err" className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={state === "sending"}>{state === "sending" ? t.sending : t.submit}</button>
    </form>
  );
}
