"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export type FlipSlide = { src: string; alt: string; label: string; zoom?: number; origin?: string };

/**
 * Card photo that flips (like a card turning) between two dishes every few seconds.
 * Uses a simple scaleX flip — reliable on all phones. Pauses on hover, tap to flip,
 * gentle crossfade for people who prefer reduced motion.
 */
export default function FlipImage({ slides, sizes, interval = 3000 }: { slides: [FlipSlide, FlipSlide]; sizes: string; interval?: number }) {
  const [idx, setIdx] = useState(0);
  const [turning, setTurning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const flip = () => {
    if (reduce) return setIdx((i) => 1 - i);
    setTurning(true);
    setTimeout(() => {
      setIdx((i) => 1 - i);
      setTurning(false);
    }, 280);
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(flip, interval);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, interval, reduce]);

  return (
    <div
      className="relative h-full w-full cursor-pointer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={flip}
      role="img"
      aria-label={`${slides[0].alt} / ${slides[1].alt}`}
    >
      <div
        className="absolute inset-0 overflow-hidden transition-transform duration-300 ease-in-out"
        style={{ transform: turning ? "scaleX(0)" : "scaleX(1)" }}
      >
        {slides.map((s, i) => (
          <div key={s.src} className="absolute inset-0 overflow-hidden transition-opacity duration-500" style={{ opacity: i === idx ? 1 : 0 }}>
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes={sizes}
              className="object-cover"
              style={s.zoom ? { transform: `scale(${s.zoom})`, transformOrigin: s.origin || "center" } : undefined}
            />
          </div>
        ))}
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-saffron-800 shadow">{slides[idx].label}</span>
      </div>
    </div>
  );
}
