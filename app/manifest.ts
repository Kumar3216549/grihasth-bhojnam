import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grihasth Bhojnam by Sachin — गृहस्थ भोजनम्",
    short_name: "Grihasth Bhojnam",
    description: "Ghar jaisa tiffin for factory workers. ₹60 daily, ₹1599 monthly. व्यापार नहीं, व्यवहार परोसते हैं हम।",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFBF3",
    theme_color: "#F28C28",
    lang: "hi-IN",
    categories: ["food", "lifestyle", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Order tiffin", short_name: "Order", url: "/order", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Today's menu", short_name: "Menu", url: "/menu", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
