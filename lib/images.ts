// All photos are free-licence Unsplash images (https://unsplash.com/license).
// Replace any of them with your own real kitchen / delivery photos later: put the file in /public/photos and use "/photos/name.jpg".
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMAGES = {
  heroWorkers: u("1664942069558-983665eac50b"), // workers sitting together, eating
  workersLunch: u("1646578524934-b74df048cb53"),
  thaliRoti: u("1546833999-b9f581a1996d"), // thali with roti, dal, sabji
  thaliTop: u("1626777552726-4a6b54c97e46"), // steel thali top view
  paneer: u("1631452180519-c014fe946bc7"), // paneer curry + rice
  rotiCurry: u("1565557623262-b51c2513a641"), // roti with curry
  curryBowls: u("1585937421612-70a008356fbe"), // dal / sabji bowls
  dal: u("1574653853027-5382a3d23a15"), // yellow dal
  mixVeg: u("1596797038530-2c107229654b"), // mixed veg
  rice: u("1512058564366-18510be2db19"), // rice
  salad: u("1525755662778-989d0524087e"), // chana salad
  rotiTawa: u("1764699486820-30a00e6ded7a"), // roti on tawa over flame
  rotiTawa2: u("1780907084874-14d202d39bf1"),
  steelTiffin: u("1633504785850-018cae02cb47"), // steel tiffin carriers
  kitchen: u("1632560957516-913e4bf9ddcf"), // cooking
};
