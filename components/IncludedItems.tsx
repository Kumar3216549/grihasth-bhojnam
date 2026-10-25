import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { includedItems } from "@/lib/menuView";
import type { Dict, Lang } from "@/lib/i18n";

/** "Packed with every meal": 2 packets of mukhwas + 2 pieces of tissue paper. Fixed, not optional, not a food category. */
export default function IncludedItems({ lang, t, compact = false }: { lang: Lang; t: Dict; compact?: boolean }) {
  const items = includedItems(lang);
  if (compact) {
    return (
      <ul className="flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.key} className="chip bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200">
            <span aria-hidden>{i.key === "mukhwas" ? "🌿" : "🧻"}</span>{i.label}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="card grid overflow-hidden sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative aspect-[3/2] sm:aspect-auto sm:min-h-[220px]">
        <Image src={IMAGES.mukhwas} alt={t.included.mukhwasAlt} fill sizes="(min-width:640px) 45vw, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <p className="eyebrow">✦ {t.included.title}</p>
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-3 text-lg font-semibold text-earth-800">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-saffron-50 text-xl ring-1 ring-saffron-200" aria-hidden>
                {i.key === "mukhwas" ? "🌿" : "🧻"}
              </span>
              {i.label}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink/65">{t.included.note}</p>
      </div>
    </div>
  );
}
