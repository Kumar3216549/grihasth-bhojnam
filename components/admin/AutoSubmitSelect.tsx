"use client";
export default function AutoSubmitSelect({ name, defaultValue, options, className = "a-input !w-auto !py-1 text-xs" }: { name: string; defaultValue: string; options: { v: string; l: string }[]; className?: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className={className} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
