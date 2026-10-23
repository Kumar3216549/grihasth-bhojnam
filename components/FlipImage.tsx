"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export type FlipSlide = { src: string; alt: string; label: string; zoom?: number; origin?: string };

/** Two photos on the front/back of a card that flips every few seconds (pauses on hover). */
export default function FlipImage({ slides, sizes, interval = 3000 }: { slides: [FlipSlide, FlipSlide]; sizes: string; interval?: number }) {
  const [back, setBack] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setBack((b) => !b), interval);
    return () => clearInterval(t);
  }, [paused, interval]);

  const face = (s: FlipSlide, isBack: boolean) => (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: isBack ? "rotateY(180deg)" : undefined }}
    >
      <Image
        src={s.src}
        alt={s.alt}
        fill
        sizes={sizes}
        className="object-cover"
        style={s.zoom ? { transform: `scale(${s.zoom})`, transformOrigin: s.origin || "center" } : undefined}
      />
      <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-saffron-800 shadow">{s.label}</span>
    </div>
  );

  return (
    <div
      className="relative h-full w-full"
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => setBack((b) => !b)}
      role="img"
      aria-label={`${slides[0].alt} / ${slides[1].alt}`}
    >
      {reduce ? (
        <>
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: back ? 0 : 1 }}>{face(slides[0], false)}</div>
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: back ? 1 : 0 }}>{face(slides[1], false)}</div>
        </>
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-700 ease-in-out"
          style={{ transformStyle: "preserve-3d", transform: back ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {face(slides[0], false)}
          {face(slides[1], true)}
        </div>
      )}
    </div>
  );
}
