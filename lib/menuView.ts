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
  const hasJeera = menu.dishes.some((d) => d.key === "jeera-rice");
  const riceToday = L(hasJeera || menu.rice === "jeera" ? DISH.jeera : DISH.plain);
  const dalDish = menu.dishes.find((d) => d.key.startsWith("dal-"));
  const sabjiDishes = menu.dishes.filter((d) => !d.key.startsWith("dal-") && d.key !== "jeera-rice");
  const sabjiToday = sabjiDishes.map(L).join(" + ");
  const open = !menu.closed;
  return [
    { key: "roti", title: L(DISH.roti), desc: t.menu.desc.roti, img: IMAGES.roti, alt: t.menu.alt.roti },
    { key: "rice", title: L(DISH.rice), desc: t.menu.desc.rice, img: IMAGES.rice, alt: t.menu.alt.rice, today: open ? fmt(t.menu.todayIs, { x: riceToday }) : undefined },
    { key: "dal", title: lang === "hi" ? "दाल" : "Dal", desc: t.menu.desc.dal, img: dalDish?.img ?? IMAGES.dal, alt: dalDish ? L(dalDish) : t.menu.alt.dal, today: open && dalDish ? fmt(t.menu.todayIs, { x: L(dalDish) }) : undefined },
    {
      key: "sabji",
      title: lang === "hi" ? "दिन की सब्ज़ी" : "Sabji of the day",
      desc: t.menu.desc.sabji,
      img: sabjiDishes[0]?.img ?? IMAGES.mixVeg,
      alt: sabjiDishes[0] ? L(sabjiDishes[0]) : t.menu.alt.mixVeg,
      today: open && sabjiToday ? fmt(t.menu.todayIs, { x: sabjiToday }) : undefined,
      flip: open && sabjiDishes.length > 1
        ? [
            { src: sabjiDishes[0].img, alt: L(sabjiDishes[0]), label: L(sabjiDishes[0]) },
            { src: sabjiDishes[1].img, alt: L(sabjiDishes[1]), label: L(sabjiDishes[1]) },
          ]
        : undefined,
    },
    { key: "salad", title: L(DISH.salad), desc: t.menu.desc.salad, img: IMAGES.salad, alt: t.menu.alt.salad },
  ];
}

export const includedItems = (lang: Lang) => INCLUDED.map((i) => ({ key: i.key, label: lang === "hi" ? i.hi : i.en }));
