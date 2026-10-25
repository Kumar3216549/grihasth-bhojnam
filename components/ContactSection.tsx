import { telHref, type Settings } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";

/** Phone (tap-to-call), official email (mailto), WhatsApp and kitchen address. */
export default function ContactSection({ t, s }: { t: Dict; s: Settings }) {
  const rows = [
    { icon: "📞", label: t.contact.phone, value: s.businessPhone, href: telHref(s.businessPhone), cta: t.contact.call },
    { icon: "✉️", label: t.contact.email, value: s.email, href: `mailto:${s.email}`, cta: t.contact.write },
    { icon: "💬", label: t.contact.whatsapp, value: "+" + s.whatsappNumber.replace(/^(\d{2})(\d{5})(\d+)$/, "$1 $2 $3"), href: `https://wa.me/${s.whatsappNumber}`, cta: t.contact.chat, ext: true },
  ];
  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <div className="mandala-bg pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-20" aria-hidden />
      <h2 className="h-section">{t.contact.title}</h2>
      <p className="mt-2 text-ink/70">{t.contact.sub}</p>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.label}>
            <a
              href={r.href}
              {...(r.ext ? { target: "_blank", rel: "noopener" } : {})}
              className="group flex items-center gap-4 rounded-xl border border-earth-100 bg-cream/60 p-3 transition hover:border-saffron-300 hover:bg-saffron-50"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden>{r.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-ink/50">{r.label}</span>
                <span className="block break-all font-semibold text-earth-800">{r.value}</span>
              </span>
              <span className="hidden text-sm font-semibold text-saffron-700 group-hover:underline sm:inline">{r.cta} →</span>
            </a>
          </li>
        ))}
        <li className="flex items-center gap-4 p-3 text-sm text-ink/70">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden>📍</span>
          <span><span className="block text-xs font-semibold uppercase tracking-wider text-ink/50">{t.contact.address}</span>{s.kitchenAddress}</span>
        </li>
      </ul>
    </div>
  );
}
