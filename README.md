# गृहस्थ भोजनम् · Grihasth Bhojnam by Sachin

> **व्यापार नहीं, व्यवहार परोसते हैं हम।** — *We don't serve business, we serve relationships.*

Ghar jaisa tiffin service for factories, companies and workers in **Ahmedabad's industrial areas** — Odhav, Kathwada, Naroda, Vatva GIDC, Narol, Changodar.
**₹80 daily thali · ₹2,100 monthly plan** — 4 tawa roti, rice, dal fry, mix veg / paneer sabji, salad.

This repo is the full website + admin system:

| Public website | Admin (`/admin`, Sachin only) |
|---|---|
| `/` Hero with Hindi + English slogan, plans, photos | **Dashboard** — tiffins today, stock alerts, renewals, profit |
| `/menu` Today's menu + week rotation | **Today's Orders** — factory-wise, status, cash received, WhatsApp |
| `/plans` Daily ₹80 / Monthly ₹2100 with Subscribe | **Tiffin Calculator** — how many to cook, rotis, raw material, what-if |
| `/order` Quick order: COD or Razorpay (UPI / card / netbanking) | **Monthly Subscribers** — expiry reminders, pause, extend, renew |
| `/order/success/…` WhatsApp-style confirmation | **Inventory** — atta, rice, dal, sabji, oil… stock in/out, low-stock alert |
| `/invoice/…` Auto invoice with logo (print / save as PDF) | **Delivery Routes** — per shift, Google Maps route, send to rider |
| `/tiffin-service/[area]` SEO page per industrial area | **Profit & Loss** — revenue, expenses, food cost per tiffin, break-even |
| Hindi / English toggle · PWA install · WhatsApp button | **Prices & Settings** — edit prices, shifts, paneer days, menu |

**Tech:** Next.js 14 (App Router) · Tailwind CSS · Prisma 7 + PostgreSQL · NextAuth · Razorpay · WhatsApp Cloud API · PWA.

Branding, 90-day campaign roadmap and ready marketing text: [`docs/BRANDING_ROADMAP_HINDI_ENGLISH.md`](docs/BRANDING_ROADMAP_HINDI_ENGLISH.md) · AI photo prompts: [`docs/AI_IMAGE_PROMPTS.md`](docs/AI_IMAGE_PROMPTS.md) · Ahmedabad launch plan: [`docs/AHMEDABAD_LAUNCH_PLAN.md`](docs/AHMEDABAD_LAUNCH_PLAN.md)

---

## Run locally

**Needs:** Node.js 20.19+ (22 recommended) and PostgreSQL 14+ (local, or a free cloud DB like [Neon](https://neon.tech) / [Supabase](https://supabase.com)).

```bash
git clone https://github.com/Kumar3216549/grihasth-bhojnam.git
cd grihasth-bhojnam
npm install

cp .env.example .env          # then edit .env (DATABASE_URL, ADMIN_PASSWORD, NEXTAUTH_SECRET…)

npx prisma migrate dev --name init   # creates the tables
npm run db:seed                      # areas + inventory items with per-tiffin recipe
# optional: sample factories, orders & subscribers to explore the admin
npm run db:seed -- --demo

npm run dev                          # http://localhost:3000   admin: http://localhost:3000/admin
```

Admin login = `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (password must be at least 8 characters).

**Try payments without Razorpay keys:** set `PAYMENT_DEMO_MODE="true"` (only works while the Razorpay keys are empty). Turn it off before going live.

## Go live (Vercel + Neon — free to start)

1. Create a Postgres DB on Neon → copy the connection string.
2. Import this repo on [vercel.com/new](https://vercel.com/new). Add all variables from `.env.example` (with real values; `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` = your domain).
3. Build command stays `npm run build`. After the first deploy run once from your computer with the production `DATABASE_URL`:
   `npx prisma migrate deploy && npm run db:seed`
4. Razorpay → Settings → **Webhooks** → `https://YOUR-DOMAIN/api/razorpay/webhook`, events `payment.captured`, `order.paid`, `payment.failed`, secret = `RAZORPAY_WEBHOOK_SECRET`.
5. Open `/admin/settings` → set real phone, WhatsApp number, kitchen address, FSSAI number, prices.
6. Open `/admin/routes` → Ahmedabad areas are pre-loaded (East cluster Odhav–Kathwada–Naroda + Vatva, Narol active; Aslali, Changodar, Moraiya, Sanand off). Switch areas on as you expand — each active area gets an SEO page `/tiffin-service/<area>`.
7. Submit `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console and create a Google Business Profile ("Tiffin service").

## Payments
- **Daily:** Cash on delivery (mark “💵 Cash received” in admin → invoice is created) or online.
- **Monthly:** online via Razorpay Checkout (UPI, cards, netbanking, wallets). On success the signature is verified on the server, the subscription is activated, an invoice number (`GB/2026-27/00001`) is created and the customer gets the invoice link on WhatsApp. The webhook makes this work even if the customer closes the browser.

## WhatsApp auto message
On every order the customer gets: *“Namaste {name}, aapka tiffin {time} par {company} me pahuch jayega.”*
- Set `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` (Meta WhatsApp Cloud API).
- Business-initiated messages need an **approved template**. Create one named e.g. `order_confirm` (language Hindi) with body:
  `Namaste {{1}}, aapka tiffin {{2}} par {{3}} me pahuch jayega. Order no. {{4}}. – Grihasth Bhojnam` and set `WHATSAPP_TEMPLATE_NAME=order_confirm`.
- Without these, nothing breaks: admin pages have 💬 buttons that open WhatsApp with the message ready to send.

## How the numbers work
- **Tiffins to cook** = daily orders for the date (COD, or paid online) + every active monthly subscription (Mon–Sat) + buffer %.
- **Raw material** = tiffins × “per tiffin” quantity of each inventory item (edit in Inventory). “Deduct stock” after cooking subtracts it.
- **Food cost per tiffin** = Σ per-tiffin quantity × purchase rate. Stock “+ In” with a rate is also booked as a Grocery expense.
- **Profit** = paid orders (by delivery / start date) − expenses, per month.

## Project structure
```
app/(site)/          public pages (home, menu, plans, order, area SEO pages)
app/admin/(panel)/   admin pages + server actions (actions.ts)
app/api/             orders, Razorpay verify + webhook, NextAuth, CSV export
app/invoice/         printable invoice
lib/                 db, i18n (Hindi/English), kitchen calculator, finance, orders, whatsapp, razorpay
prisma/              schema.prisma, seed.ts
public/              logo, PWA icons, service worker, offline page, OG image
docs/                branding roadmap, AI image prompts
```

## Photos
Website photos are free-licence images from [Unsplash](https://unsplash.com/license), listed in `lib/images.ts`. Replace them with your own kitchen and delivery photos (put files in `public/photos/`) — real photos build the most trust.

---
Made with ❤️ for India's working hands. © Grihasth Bhojnam by Sachin.

## Update — Oct 2026: fixed menu, UPI prepaid, feedback

- **Thali:** 4 tawa roti · rice · dal · sabji of the day · salad. Sabji/dal follow the **Laziz weekly menu** (Mon Aloo Gobhi + Dal Fry, Tue Mix Veg + Dal Tadka, Wed Paneer Butter Masala + Dal Fry ⭐, Thu Rajma + Jeera Rice, Fri Chhole + Mix Veg, Sat Matar Paneer + Dal Fry ⭐, Sun rest day) — edit `WEEKLY` in `lib/menu.ts`; dish photos in `public/photos/week/`.
  Every meal also includes **2 packets of mukhwas** and **2 pieces of tissue paper** (shown on the menu, order summary, order page and invoice).
  Per day you only choose the rice and whether paneer butter masala is available: **/admin/settings → Menu availability**.
- **Payments:** customers choose **Prepaid (UPI)** or **COD pre-order** (pay cash at delivery).
  - Prepaid goes ONLY to your own UPI. Add your **UPI ID** (and optionally a QR image link) in **/admin/settings → UPI**. Until then the website hides “Prepaid” and only offers COD.
  - The customer sees the amount, UPI ID / QR, a “Pay in UPI app” button and enters the UPI reference (UTR). This is **not** proof of payment.
  - Check the money in your bank / UPI app, then press **✅ Verify** in **/admin/orders** (section “UPI prepaid — waiting for your verification”). Only then is the order counted in the kitchen sheet and the customer gets the WhatsApp confirmation.
  - Payment-screenshot upload is not enabled: it would need file storage (e.g. Vercel Blob). The UTR reference is enough to match payments.
  - Razorpay code is still in the repo but no longer used by the order form.
- **Contact:** phone 8434816583 (tap-to-call) and sachinjha608@gmail.com (mailto) in the header link, contact section and footer. Editable in settings.
- **Feedback:** form on the home page (#feedback) → stored in the `Feedback` table → read at **/admin/feedback**. Spam guard: honeypot field, minimum fill time, rate limit; no IP or device data is stored.
- **Look & fonts:** warm cream / saffron / earthy brown / leaf green, subtle mandala and toran details, “अन्नं ब्रह्म” shloka band. Fonts are the same as the Zindagi with Sachin site: **Merriweather + Mukta**.
- **Photos:** owner-supplied images in `public/photos/` (hero, roti, jeera rice, mix veg, paneer butter masala, mukhwas, four promo cards cut out as separate images). Dal and salad use the Unsplash photos listed in the brief.
- **Database:** new columns/tables are created automatically by `prisma db push` during the Vercel build (`Order.upiRef`, `Order.clientKey`, `DailyMenu.riceType`, `Feedback`, payment method `UPI`).
