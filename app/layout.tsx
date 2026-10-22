import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/lib/lang";
import { SITE_URL, SEO_KEYWORDS } from "@/lib/site";
import { SLOGAN } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Grihasth Bhojnam by Sachin — ₹60 Ghar Jaisa Tiffin | Factory Tiffin Delivery",
    template: "%s | Grihasth Bhojnam",
  },
  description:
    "Sasta monthly tiffin & daily tiffin service for factories, companies and workers in industrial areas. 4 tawa roti, rice, dal fry, sabji, salad — ₹60 daily, ₹1599 monthly. " +
    SLOGAN.en,
  keywords: SEO_KEYWORDS,
  applicationName: "Grihasth Bhojnam",
  authors: [{ name: "Sachin" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Grihasth Bhojnam",
    title: "Grihasth Bhojnam — ghar jaisa tiffin at your factory gate",
    description: "₹60 daily thali, ₹1599 monthly plan. " + SLOGAN.hi,
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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap"
        />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
