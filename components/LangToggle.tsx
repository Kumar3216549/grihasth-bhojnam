"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LangToggle({ lang, label }: { lang: "hi" | "en"; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        const next = lang === "hi" ? "en" : "hi";
        document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = next;
        start(() => router.refresh());
      }}
      className="rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1.5 text-xs font-semibold text-leaf-800 hover:bg-leaf-100"
      aria-label="Change language / भाषा बदलें"
      disabled={pending}
    >
      <span aria-hidden>अ/A</span> {label}
    </button>
  );
}
