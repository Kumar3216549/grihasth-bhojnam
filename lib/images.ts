// 100% शुद्ध शाकाहारी, North Indian food only.
// - /photos/*.webp: images supplied by the owner (Sachin), cropped and compressed for the web.
//   The four promo cards were cut out of 07_promotional_cards_reference.png as separate images (no stretched collage).
// - Free-licence photos: dal (Unsplash), salad (Pexels 36551295).
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMAGES = {
  hero: "/photos/01_hero_indian_corporate_lunch.webp", // Indian office colleagues sharing a North Indian veg lunch
  roti: "/photos/02_tawa_roti.webp", // phulka puffing on a tawa
  rice: "/photos/03_jeera_rice.webp", // jeera rice (photo sent by Sachin)
  dal: u("1626500154744-e4b394ffea16"), // dal fry with tadka
  mixVeg: "/photos/05_mix_veg_sabzi.webp", // mix veg sabzi (photo sent by Sachin)
  paneer: "/photos/09_paneer_butter_masala.webp", // paneer butter masala
  salad: "https://images.pexels.com/photos/36551295/pexels-photo-36551295.jpeg", // cucumber, tomato, onion rings on a plate (Pexels, free licence)
  mukhwas: "/photos/08_mukhwas_packets.webp", // 2 packets of mukhwas included with every meal
  promoRoti: "/photos/07_promo_roti_tawa.webp",
  promoRice: "/photos/07_promo_rice.webp",
  promoPacking: "/photos/07_promo_packaging.webp", // hygienic disposable compartment box
  promoThali: "/photos/07_promo_thali.webp", // roti, rice, dal, paneer butter masala, salad
  thaliTop: u("1680359873864-43e89bf248ac"), // steel veg thali with rotis and katoris
};
