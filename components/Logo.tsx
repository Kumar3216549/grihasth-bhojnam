export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return <img src="/logo-mark.svg" alt="" aria-hidden className={className} width={40} height={40} />;
}

export function Logo({ lang, compact = false }: { lang: "hi" | "en"; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-tight">
        <span className="block font-hindi text-lg font-bold text-saffron-700">गृहस्थ भोजनम्</span>
        {!compact && (
          <span className="block text-[11px] font-medium uppercase tracking-wider text-leaf-700">
            Grihasth Bhojnam {lang === "hi" ? "· सचिन द्वारा" : "by Sachin"}
          </span>
        )}
      </span>
    </span>
  );
}
