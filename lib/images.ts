// 100% शुद्ध शाकाहारी. Real photos: free-licence Unsplash (https://unsplash.com/license) and Pexels (https://www.pexels.com/license/) images,
// each checked by eye to show only veg food (roti, dal, rice, paneer, sabji, salad) — no chunky curries that could look non-veg.
// Replace any of them with your own real kitchen / delivery photos later: put the file in /public/photos and use "/photos/name.jpg".
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMAGES = {
  heroWorkers: "https://images.pexels.com/photos/9345661/pexels-photo-9345661.jpeg", // real photo (Pexels licence): mother and son enjoying a pure-veg lunch — roti, chole, paneer, rice
  workersLunch: u("1789990642036-e10c2df4fc81"), // aloo matar with puri
  thaliRoti: u("1727018742095-14c9a05aa71a"), // yellow dal, rice and cucumber
  thaliTop: u("1680359873864-43e89bf248ac"), // steel veg thali with rotis and katoris
  paneer: u("1589647363585-f4a7d3877b10"), // palak paneer — paneer cubes clearly visible
  rotiCurry: u("1717587052948-fb9825de50f8"), // chole bhature
  curryBowls: u("1589778655375-3e622a9fc91c"), // big veg thali with many katoris
  dal: u("1626500154744-e4b394ffea16"), // dal with green chilli, lemon and onion
  mixVeg: u("1764312538830-d67452377fed"), // beans, potato and onion sabji
  rice: u("1751618646882-4221d5e3b1c2"), // veg pulao with peas and paneer
  salad: u("1722032617357-7b09276b1a8d"), // fresh green salad with tomato and cucumber
  rotiTawa: u("1786640442878-0c216561af21"), // roti being made on a tawa
  rotiTawa2: u("1780907084884-ded9fddbb474"), // roti on tawa
  steelTiffin: u("1633504785850-018cae02cb47"), // steel tiffin carriers
  kitchen: u("1600935926387-12d9b03066f0"), // fresh stack of chapatis
};
