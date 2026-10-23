// 100% vegetarian. All photos are free-licence Unsplash images (https://unsplash.com/license).
// Replace any of them with your own real kitchen / delivery photos later: put the file in /public/photos and use "/photos/name.jpg".
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMAGES = {
  heroWorkers: "/photos/hero-lunch.svg", // illustration: workers having lunch together at a clean canteen table
  workersLunch: u("1567337710282-00832b415979"), // roti with dal in steel thali
  thaliRoti: u("1742281257687-092746ad6021"), // steel veg thali with rice
  thaliTop: u("1626777552726-4a6b54c97e46"), // steel thali top view
  paneer: u("1631452180539-96aca7d48617"), // paneer butter masala, rice, papad
  rotiCurry: u("1767114915936-745dd372f1d8"), // palak with paratha
  curryBowls: u("1585937421612-70a008356fbe"), // dal / sabji bowls
  dal: u("1755090154817-58d9d36ec988"), // yellow dal tadka
  mixVeg: u("1778439800378-6f67fd8ec219"), // seasonal veg sabji
  rice: u("1788603092417-a01e665e0ab2"), // jeera rice with dal
  salad: u("1541696432-7a70d69e0309"), // fresh veg salad
  rotiTawa: u("1764699486820-30a00e6ded7a"), // roti on tawa over flame
  rotiTawa2: u("1780907084874-14d202d39bf1"),
  steelTiffin: u("1633504785850-018cae02cb47"), // steel tiffin carriers
  kitchen: u("1767114915989-c6ab3c8fc42e"), // fresh veg curries & rice
};
