import { getSettings, upiReady } from "@/lib/settings";
import { getWeekMenu } from "@/lib/menu";
import { paneerDayList } from "@/lib/settings";
import { todayDb, ymd, fmtDate } from "@/lib/dates";
import { demoPayments, razorpayEnabled } from "@/lib/razorpay";
import { Badge, Flash, PageTitle } from "@/components/admin/ui";
import { saveMenu, saveSettings } from "../actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SettingsPage({ searchParams }: { searchParams: { ok?: string } }) {
  const s = await getSettings();
  const week = await getWeekMenu(todayDb(), paneerDayList(s), s.riceType);
  const wa = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const F = ({ name, label, hint, type = "text" }: { name: keyof typeof s; label: string; hint?: string; type?: string }) => (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} type={type} defaultValue={s[name]} className="a-input mt-1" />
      {hint && <span className="mt-0.5 block text-xs text-stone-500">{hint}</span>}
    </label>
  );

  return (
    <div>
      <PageTitle title="Prices & Settings" hi="दाम, शिफ्ट टाइम, संपर्क — यहाँ से बदलें" />
      <Flash ok={searchParams.ok} />

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Badge tone={upiReady(s) ? "leaf" : "red"}>UPI prepaid: {upiReady(s) ? "on" : "off — add your UPI ID / QR below"}</Badge>
        <Badge tone="stone">Razorpay (not used on the website): {razorpayEnabled() ? "connected" : demoPayments() ? "demo mode" : "not set"}</Badge>
        <Badge tone={wa ? "leaf" : "amber"}>WhatsApp API: {wa ? "connected" : "not set (manual links only)"}</Badge>
        <Badge tone={process.env.NEXT_PUBLIC_SITE_URL ? "leaf" : "amber"}>Site URL: {process.env.NEXT_PUBLIC_SITE_URL || "not set"}</Badge>
      </div>

      <form action={saveSettings} className="grid gap-6 lg:grid-cols-2">
        <section className="a-card space-y-3">
          <h2 className="font-semibold">💰 Prices (shown on website instantly)</h2>
          <div className="grid grid-cols-2 gap-3">
            <F name="dailyPrice" label="Daily Veg Thali ₹" type="number" />
            <F name="paneerPrice" label="Paneer Butter Masala thali ₹" type="number" />
            <F name="monthlyPrice" label="Monthly plan ₹" type="number" />
            <F name="monthlyDays" label="Working days in plan" type="number" hint="Mon–Sat, Sunday off" />
            <F name="bulkPrice" label="Bulk rate ₹ (20+)" type="number" hint="Quoted on WhatsApp" />
            <F name="bufferPercent" label="Extra tiffins buffer %" type="number" hint="For walk-in / last minute" />
          </div>
        </section>
        <section className="a-card space-y-3">
          <h2 className="font-semibold">⏰ Service</h2>
          <F name="shifts" label="Shift / delivery times" hint="Separate with | e.g. Lunch 12:30 PM|Dinner 7:30 PM" />
          <div className="grid grid-cols-2 gap-3">
            <F name="orderCutoff" label="Same-day order cutoff" />
            <F name="paneerDays" label="Paneer butter masala days" hint={`0=Sun … 6=Sat → now: ${paneerDayList(s).map((d) => DAYS[d]).join(", ")}`} />
          </div>
          <label className="block text-sm">
            <span className="font-medium">Default rice</span>
            <select name="riceType" defaultValue={s.riceType} className="a-input mt-1">
              <option value="jeera">Jeera rice / जीरा राइस</option>
              <option value="plain">Plain rice / सादा चावल</option>
            </select>
          </label>
        </section>
        <section className="a-card space-y-3">
          <h2 className="font-semibold">📞 Contact & legal</h2>
          <div className="grid grid-cols-2 gap-3">
            <F name="businessPhone" label="Phone (display)" />
            <F name="whatsappNumber" label="WhatsApp number" hint="With country code, no + (91…)" />
            <F name="email" label="Official email" type="email" />
            <F name="fssaiNo" label="FSSAI registration no." />
            <F name="gstin" label="GSTIN (optional)" />
            <F name="city" label="City" />
          </div>
          <F name="kitchenAddress" label="Kitchen address (route start)" />
        </section>
        <section className="a-card space-y-3">
          <h2 className="font-semibold">📱 UPI for prepaid orders</h2>
          <p className="text-xs text-stone-500">
            Customers pay ONLY to these details. Leave blank until you have your real UPI ID — the website then hides “Prepaid” and offers COD pre-order only.
            Payments are never auto-confirmed: verify each one in Orders after checking your bank / UPI app.
          </p>
          <F name="upiId" label="Your UPI ID" hint="e.g. yourname@okaxis — exactly as in your UPI app" />
          <F name="upiPayeeName" label="Name shown to customers" />
          <F name="upiQrUrl" label="UPI QR image link (optional)" hint="Upload your QR as public/photos/upi-qr.png and write /photos/upi-qr.png, or paste an https:// image link" />
          {s.upiQrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.upiQrUrl} alt="UPI QR preview" className="h-32 w-32 rounded border border-stone-200 object-contain p-1" />
          )}
        </section>
        <div className="flex items-start lg:col-span-2"><button className="a-btn !px-6 !py-2.5">Save settings</button></div>
      </form>

      <section className="a-card mt-8">
        <h2 className="font-semibold">🍛 Menu availability for the next 7 days</h2>
        <p className="mb-3 text-xs text-stone-500">
          The menu is fixed (4 tawa roti · rice · dal fry · mix veg / paneer butter masala · salad, plus 2 mukhwas + 2 tissue).
          Only choose which rice is cooked and whether paneer butter masala is available. ↺ = back to the default settings.
        </p>
        <div className="space-y-2">
          {week.map((d) => (
            <form key={ymd(d.date)} action={saveMenu} className="grid items-center gap-2 sm:grid-cols-[9rem_12rem_1fr_auto]">
              <input type="hidden" name="date" value={ymd(d.date)} />
              <span className="text-sm font-medium">{DAYS[d.date.getUTCDay()]} · {fmtDate(d.date)}{d.closed ? " (closed)" : ""}</span>
              <select name="riceType" defaultValue={d.rice} className="a-input">
                <option value="jeera">Jeera rice</option>
                <option value="plain">Plain rice</option>
              </select>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="isPaneer" defaultChecked={d.isPaneer} /> Paneer butter masala available</label>
              <span className="flex gap-1">
                <button className="a-btn-ghost !py-1.5 text-xs">Save</button>
                <button name="reset" value="1" className="a-btn-ghost !py-1.5 text-xs" title="Back to default rotation">↺</button>
              </span>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
