"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function PWARegister({ label, hint, closeLabel = "Close" }: { label: string; hint: string; closeLabel?: string }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    try { if (localStorage.getItem("gb_install_dismissed")) setHidden(true); } catch {}
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!evt || hidden) return null;
  return (
    <div className="no-print fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-saffron-200 bg-white p-3 shadow-xl sm:bottom-6">
      <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
      <p className="flex-1 text-sm font-medium">{hint}</p>
      <button className="btn-primary !px-4 !py-2" onClick={async () => { await evt.prompt(); setEvt(null); }}>{label}</button>
      <button aria-label={closeLabel} className="px-1 text-ink/50" onClick={() => { setHidden(true); try { localStorage.setItem("gb_install_dismissed", "1"); } catch {} }}>✕</button>
    </div>
  );
}
