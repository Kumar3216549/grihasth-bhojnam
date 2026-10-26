"use client";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    qrcode?: (type: number, ecl: string) => { addData: (s: string) => void; make: () => void; createSvgTag: (o: { cellSize: number; margin: number; scalable?: boolean }) => string };
  }
}

let loader: Promise<void> | null = null;
function loadLib() {
  if (typeof window !== "undefined" && window.qrcode) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("QR library failed to load"));
    document.head.appendChild(s);
  });
  return loader;
}

/** Renders a QR code (SVG) for `value`. Falls back to showing the code text if the library can't load. */
export default function QrCode({ value, label, size = 240 }: { value: string; label: string; size?: number }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadLib()
      .then(() => {
        const q = window.qrcode!(0, "M");
        q.addData(value);
        q.make();
        if (alive) setSvg(q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [value]);
  return (
    <div role="img" aria-label={label} className="mx-auto rounded-2xl bg-white p-3 shadow-card ring-1 ring-earth-100" style={{ width: size + 24 }}>
      {svg ? (
        <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="flex items-center justify-center text-xs text-ink/50" style={{ width: size, height: size }}>
          {failed ? <span className="break-all p-2 font-mono">{value}</span> : "…"}
        </div>
      )}
    </div>
  );
}
