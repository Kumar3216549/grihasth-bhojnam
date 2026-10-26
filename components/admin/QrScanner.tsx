"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (o: { formats: string[] }) => Detector;
    jsQR?: (data: Uint8ClampedArray, w: number, h: number) => { data: string } | null;
  }
}

function loadJsQR() {
  if (window.jsQR) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("scanner library failed"));
    document.head.appendChild(s);
  });
}

/** Reads an order QR with the phone camera and opens /admin/scan?c=<token>. */
export default function QrScanner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!on) return;
    let stream: MediaStream | null = null;
    let stop = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
        if (!detector) await loadJsQR();
        const tick = async () => {
          if (stop) return;
          let text = "";
          if (v.videoWidth) {
            if (detector) {
              const r = await detector.detect(v).catch(() => []);
              text = r[0]?.rawValue || "";
            } else if (window.jsQR) {
              canvas.width = v.videoWidth;
              canvas.height = v.videoHeight;
              ctx.drawImage(v, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              text = window.jsQR(img.data, img.width, img.height)?.data || "";
            }
          }
          if (text) {
            const m = text.match(/[?&]c=([A-Za-z0-9_-]+)/) || text.match(/order\/success\/([A-Za-z0-9_-]+)/) || text.match(/^([a-z0-9]{20,40})$/);
            if (m) {
              stop = true;
              router.push(`/admin/scan?c=${m[1]}`);
              return;
            }
          }
          setTimeout(tick, 250);
        };
        tick();
      } catch {
        setErr("Camera not available. Allow camera access, or scan the QR with your phone's camera app.");
        setOn(false);
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [on, router]);

  return (
    <div className="a-card">
      {on ? (
        <>
          <video ref={video} className="mx-auto aspect-square w-full max-w-sm rounded-xl bg-black object-cover" muted playsInline />
          <button className="a-btn-ghost mt-3 w-full" onClick={() => setOn(false)}>Stop camera</button>
        </>
      ) : (
        <button className="a-btn w-full !py-4 text-base" onClick={() => { setErr(""); setOn(true); }}>📷 Scan customer QR</button>
      )}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <p className="mt-2 text-xs text-stone-500">Tip: the phone&apos;s normal camera app also works — the QR opens this page directly (you must be logged in).</p>
    </div>
  );
}
