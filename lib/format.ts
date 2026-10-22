export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const num = (n: number, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en-IN");
export function cleanPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d;
}
export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(text)}`;
export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") || "area";
}
