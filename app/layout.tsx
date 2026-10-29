import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/lib/lang";
import { SITE_URL, SEO_KEYWORDS } from "@/lib/site";
import { SLOGAN } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Grihasth Bhojnam by Sachin — ₹87 Ghar Jaisa Tiffin | Factory Tiffin Delivery in Ahmedabad",
    template: "%s | Grihasth Bhojnam",
  },
  description:
    "Sasta monthly tiffin & daily tiffin service for factories and workers in Ahmedabad — Naroda, Odhav, Vatva, Kathwada GIDC & Changodar. 4 tawa roti, rice, dal fry, sabji, salad — ₹87 daily, ₹2080 monthly. " +
    SLOGAN.en,
  keywords: SEO_KEYWORDS,
  applicationName: "Grihasth Bhojnam",
  authors: [{ name: "Sachin" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Grihasth Bhojnam",
    title: "Grihasth Bhojnam — ghar jaisa tiffin at your factory gate",
    description: "₹87 daily thali, ₹2080 monthly plan. " + SLOGAN.hi,
    locale: "hi_IN",
    alternateLocale: ["en_IN"],
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Grihasth Bhojnam", statusBarStyle: "default" },
  icons: { icon: "/logo-mark.svg", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = { themeColor: "#F28C28", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Mukta:wght@400;500;600;700;800&display=swap"
        />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
