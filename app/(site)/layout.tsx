import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PWARegister from "@/components/PWARegister";
import { getDict } from "@/lib/lang";
import { getSettings, prices } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";
import { SLOGAN } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = getDict();
  const s = await getSettings();
  const p = prices(s);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: "Grihasth Bhojnam by Sachin",
    alternateName: "गृहस्थ भोजनम्",
    slogan: `${SLOGAN.hi} / ${SLOGAN.en}`,
    servesCuisine: ["Indian", "North Indian", "Vegetarian"],
    priceRange: "₹",
    url: SITE_URL,
    telephone: s.businessPhone,
    image: `${SITE_URL}/og.png`,
    address: { "@type": "PostalAddress", streetAddress: s.kitchenAddress, addressLocality: s.city, addressCountry: "IN" },
    hasMenu: `${SITE_URL}/menu`,
    makesOffer: [
      { "@type": "Offer", name: "Daily Veg Thali Tiffin", price: p.daily, priceCurrency: "INR" },
      { "@type": "Offer", name: "Monthly Tiffin Plan", price: p.monthly, priceCurrency: "INR" },
    ],
  };
  return (
    <>
      <Header lang={lang} t={t} />
      <main>{children}</main>
      <Footer lang={lang} t={t} s={s} />
      <WhatsAppFloat number={s.whatsappNumber} text={lang === "hi" ? "नमस्ते, मुझे टिफ़िन चाहिए।" : "Namaste, I want to order tiffin."} />
      <PWARegister label={t.pwa.install} hint={t.pwa.installHint} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
