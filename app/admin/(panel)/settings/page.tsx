import { getSettings } from "@/lib/settings";
import { getWeekMenu } from "@/lib/menu";
import { paneerDayList } from "@/lib/settings";
import { todayDb, ymd, fmtDate } from "@/lib/dates";
import { demoPayments, razorpayEnabled } from "@/lib/razorpay";
import { Badge, Flash, PageTitle } from "@/components/admin/ui";
import { saveMenu, saveSettings } from "../actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SettingsPage({ searchParams }: { searchParams: { ok?: string } }) {
  const s = await getSettings();
  const week = await getWeekMenu(todayDb(), paneerDayList(s));
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
        <Badge tone={razorpayEnabled() ? "leaf" : demoPayments() ? "amber" : "red"}>Razorpay: {razorpayEnabled() ? "connected" : demoPayments() ? "demo mode" : "not set"}</Badge>
        <Badge tone={wa ? "leaf" : "amber"}>WhatsApp API: {wa ? "connected" : "not set (manual links only)"}</Badge>
        <Badge tone={process.env.NEXT_PUBLIC_SITE_URL ? "leaf" : "amber"}>Site URL: {process.env.NEXT_PUBLIC_SITE_URL || "not set"}</Badge>
      </div>

      <form action={saveSettings} className="grid gap-6 lg:grid-cols-2">
        <section className="a-card space-y-3">
          <h2 className="font-semibold">💰 Prices (shown on website instantly)</h2>
          <div className="grid grid-cols-2 gap-3">
            <F name="dailyPrice" label="Daily Veg Thali ₹" type="number" />
            <F name="paneerPrice" label="Paneer Special ₹" type="number" />
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
            <F name="paneerDays" label="Paneer days" hint={`0=Sun … 6=Sat → now: ${paneerDayList(s).map((d) => DAYS[d]).join(", ")}`} />
          </div>
        </section>
        <section className="a-card space-y-3">
          <h2 className="font-semibold">📞 Contact & legal</h2>
          <div className="grid grid-cols-2 gap-3">
            <F name="businessPhone" label="Phone (display)" />
            <F name="whatsappNumber" label="WhatsApp number" hint="With country code, no + (91…)" />
            <F name="fssaiNo" label="FSSAI registration no." />
            <F name="gstin" label="GSTIN (optional)" />
            <F name="upiId" label="UPI ID (optional)" />
            <F name="city" label="City" />
          </div>
          <F name="kitchenAddress" label="Kitchen address (route start)" />
        </section>
        <div className="flex items-start lg:col-span-2"><button className="a-btn !px-6 !py-2.5">Save settings</button></div>
      </form>

      <section className="a-card mt-8">
        <h2 className="font-semibold">🍛 Menu for the next 7 days</h2>
        <p className="mb-3 text-xs text-stone-500">Blank days use the default weekly rotation. Changes show on /menu and the home page.</p>
        <div className="space-y-2">
          {week.map((d) => (
            <form key={ymd(d.date)} action={saveMenu} className="grid items-center gap-2 sm:grid-cols-[8rem_1fr_1fr_auto_auto]">
              <input type="hidden" name="date" value={ymd(d.date)} />
              <span className="text-sm font-medium">{DAYS[d.date.getUTCDay()]} · {fmtDate(d.date)}</span>
              <input name="sabjiEn" defaultValue={d.sabjiEn} className="a-input" placeholder="Sabji (English)" />
              <input name="sabjiHi" defaultValue={d.sabjiHi} className="a-input font-hindi" placeholder="सब्ज़ी (हिंदी)" />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isPaneer" defaultChecked={d.isPaneer} /> Paneer</label>
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
