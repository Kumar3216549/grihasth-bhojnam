/** Small decorative pieces for the warm Indian hospitality look. All are aria-hidden. */

export function Lotus({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden fill="none">
      <path d="M32 4c6 8 6 18 0 30c-6-12-6-22 0-30z" fill="#F28C28" />
      <path d="M32 34c-4-10-12-16-24-16c4 10 12 16 24 16z" fill="#FDB066" />
      <path d="M32 34c4-10 12-16 24-16c-4 10-12 16-24 16z" fill="#FDB066" />
      <path d="M32 34c-8-4-16-4-28 0c10 4 20 4 28 0z" fill="#1E7B3A" opacity=".85" />
      <path d="M32 34c8-4 16-4 28 0c-10 4-20 4-28 0z" fill="#1E7B3A" opacity=".85" />
    </svg>
  );
}

/** Thin rangoli-style divider with a lotus in the middle */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-saffron-300 sm:w-24" />
      <span className="h-1.5 w-1.5 rotate-45 bg-saffron-400" />
      <Lotus className="h-5 w-8" />
      <span className="h-1.5 w-1.5 rotate-45 bg-saffron-400" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-saffron-300 sm:w-24" />
    </div>
  );
}

/** Section heading with eyebrow ornament */
export function SectionTitle({ title, sub, center = true }: { title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <h2 className="h-section">{title}</h2>
      {center && <Divider className="mt-3" />}
      {sub && <p className="mt-3 text-ink/70">{sub}</p>}
    </div>
  );
}
