import { DISH, INCLUDED, type MenuDay } from "./menu";
import { IMAGES } from "./images";
import { fmt, type Dict, type Lang } from "./i18n";

export type DishCard = {
  key: "roti" | "rice" | "dal" | "sabji" | "salad";
  title: string;
  desc: string;
  img: string;
  alt: string;
  /** "Today: Jeera Rice" etc. — only for the two configurable categories */
  today?: string;
  /** For the sabji card on paneer days: show both available options */
  flip?: { src: string; alt: string; label: string }[];
};

/** The five fixed categories, in order, with today's actual option where it varies. */
export function dishCards(lang: Lang, t: Dict, menu: MenuDay): DishCard[] {
  const L = (d: { en: string; hi: string }) => (lang === "hi" ? d.hi : d.en);
  const riceToday = L(menu.rice === "plain" ? DISH.plain : DISH.jeera);
  const sabjiToday = menu.isPaneer ? fmt(t.menu.orBoth, { a: L(DISH.mixVeg), b: L(DISH.paneer) }) : L(DISH.mixVeg);
  const open = !menu.closed;
  return [
    { key: "roti", title: L(DISH.roti), desc: t.menu.desc.roti, img: IMAGES.roti, alt: t.menu.alt.roti },
    { key: "rice", title: L(DISH.rice), desc: t.menu.desc.rice, img: IMAGES.rice, alt: t.menu.alt.rice, today: open ? fmt(t.menu.todayIs, { x: riceToday }) : undefined },
    { key: "dal", title: L(DISH.dal), desc: t.menu.desc.dal, img: IMAGES.dal, alt: t.menu.alt.dal },
    {
      key: "sabji",
      title: L(DISH.sabji),
      desc: t.menu.desc.sabji,
      img: IMAGES.mixVeg,
      alt: t.menu.alt.mixVeg,
      today: open ? fmt(t.menu.todayIs, { x: sabjiToday }) : undefined,
      flip: open && menu.isPaneer
        ? [
            { src: IMAGES.paneer, alt: t.menu.alt.paneer, label: L(DISH.paneer) },
            { src: IMAGES.mixVeg, alt: t.menu.alt.mixVeg, label: L(DISH.mixVeg) },
          ]
        : undefined,
    },
    { key: "salad", title: L(DISH.salad), desc: t.menu.desc.salad, img: IMAGES.salad, alt: t.menu.alt.salad },
  ];
}

export const includedItems = (lang: Lang) => INCLUDED.map((i) => ({ key: i.key, label: lang === "hi" ? i.hi : i.en }));
