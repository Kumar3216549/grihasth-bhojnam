"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type TiffinSlide = { src: string; alt: string; day: string; dishes: string; badge?: string; today?: boolean };

/**
 * Plans-page hero slider: one tiffin box per weekday, sliding left every few seconds.
 * A soft gold light follows the cursor ("dazzle"), a gold shine sweeps across on each slide.
 * Pauses on hover / focus, swipe on phones, arrows + dots, keyboard ← →.
 */
export default function TiffinSlider({ slides, start = 0, interval = 3500, labels }: { slides: TiffinSlide[]; start?: number; interval?: number; labels: { prev: string; next: string; today: string } }) {
  const n = slides.length;
  const [idx, setIdx] = useState(Math.min(Math.max(start, 0), n - 1));
  const [paused, setPaused] = useState(false);
  const [shine, setShine] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => {
    setIdx(((i % n) + n) % n);
    setShine((s) => s + 1);
  }, [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => go(idx + 1), interval);
    return () => clearInterval(t);
  }, [paused, idx, interval, go, n]);

  const onMove = (e: React.MouseEvent) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
  };
  const onLeave = () => {
    setPaused(false);
    const el = box.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const s = slides[idx];
  return (
    <div className="relative [perspective:1200px]">
      <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gold-400/20 blur-2xl" aria-hidden />
      <div
        ref={box}
        className="dazzle gold-frame relative transition-transform duration-300 ease-out [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]"
        onMouseEnter={() => setPaused(true)}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
        onTouchEnd={(e) => {
          const sx = touchX.current;
          touchX.current = null;
          setPaused(false);
          if (sx == null) return;
          const dx = e.changedTouches[0].clientX - sx;
          if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(idx + 1);
          if (e.key === "ArrowLeft") go(idx - 1);
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${s.day} — ${s.dishes}`}
      >
        <div className="relative aspect-[1000/862] overflow-hidden rounded-[2rem] bg-royal-900">
          {/* sliding track */}
          <div className="flex h-full transition-transform duration-700 ease-[cubic-bezier(.22,.8,.2,1)]" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {slides.map((sl, i) => (
              <div key={sl.src} className="relative h-full w-full flex-none" aria-hidden={i !== idx}>
                <Image
                  src={sl.src}
                  alt={sl.alt}
                  fill
                  priority={i === idx}
                  sizes="(min-width:1024px) 45vw, 100vw"
                  className={`object-cover transition-transform duration-[1600ms] ease-out ${i === idx ? "scale-105" : "scale-100"}`}
                />
              </div>
            ))}
          </div>

          {/* gold shine sweep on every slide change */}
          <span key={shine} className="dazzle-sweep pointer-events-none absolute inset-0" aria-hidden />
          {/* light that follows the cursor */}
          <span className="dazzle-glow pointer-events-none absolute inset-0" aria-hidden />

          {/* caption */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-royal-950/90 via-royal-950/50 to-transparent p-4 pt-16 sm:p-5 sm:pt-20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-3 py-1 text-xs font-bold text-royal-900">{s.day}</span>
              {s.today && <span className="rounded-full bg-leaf-500 px-2.5 py-1 text-[11px] font-bold text-white">● {labels.today}</span>}
              {s.badge && <span className="rounded-full border border-gold-300/60 px-2.5 py-1 text-[11px] font-semibold text-gold-100">⭐ {s.badge}</span>}
            </div>
            <p className="mt-2 text-lg font-bold text-white drop-shadow sm:text-xl">{s.dishes}</p>
          </div>

          {/* arrows */}
          <button type="button" onClick={() => go(idx - 1)} aria-label={labels.prev} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-300/50 bg-royal-950/50 text-xl text-gold-100 backdrop-blur transition hover:scale-110 hover:bg-royal-950/80">‹</button>
          <button type="button" onClick={() => go(idx + 1)} aria-label={labels.next} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-300/50 bg-royal-950/50 text-xl text-gold-100 backdrop-blur transition hover:scale-110 hover:bg-royal-950/80">›</button>
        </div>
      </div>

      {/* dots */}
      <div className="mt-4 flex justify-center gap-2">
        {slides.map((sl, i) => (
          <button
            key={sl.src}
            type="button"
            onClick={() => go(i)}
            aria-label={sl.day}
            aria-current={i === idx}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-gradient-to-r from-gold-300 to-gold-500 shadow-gold" : "w-2.5 bg-white/30 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
