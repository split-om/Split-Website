export type MenuItem = {
  id: string;
  name: string;
  detail?: string;
  omr: number;
  category: "Drinks" | "Food" | "Sweets";
  photo?: string;
};

export const VENUE_MENUS: Record<string, MenuItem[]> = {
  qahwa: [
    { id: "karak", name: "Karak", detail: "Cardamom tea, condensed milk", omr: 0.8, category: "Drinks" },
    { id: "flat-white", name: "Flat white", detail: "Oat milk on request", omr: 1.8, category: "Drinks" },
    { id: "cappuccino", name: "Cappuccino", omr: 1.6, category: "Drinks" },
    { id: "americano", name: "Americano", omr: 1.4, category: "Drinks" },
    { id: "water", name: "Still water", omr: 0.6, category: "Drinks" },
    { id: "fizz", name: "Pomegranate fizz", omr: 2.4, category: "Drinks" },
    { id: "avocado", name: "Avocado toast", detail: "Sourdough, chilli, lime", omr: 3.6, category: "Food" },
    { id: "shakshuka", name: "Shakshuka", detail: "Eggs, tomato, warm bread", omr: 4.2, category: "Food" },
    { id: "shuwa", name: "Shuwa slider", detail: "Slow-cooked, saffron onion", omr: 3.2, category: "Food" },
    { id: "croissant", name: "Date croissant", omr: 1.4, category: "Food" },
    { id: "muffin", name: "Blueberry muffin", omr: 1.2, category: "Sweets" },
    { id: "luqaimat", name: "Luqaimat", detail: "Date syrup", omr: 2.1, category: "Sweets" },
  ],
};

export function menuForVenue(slug: string): MenuItem[] {
  return VENUE_MENUS[slug] ?? VENUE_MENUS.qahwa;
}
