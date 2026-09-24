// ---------------------------------------------------------------------------
// Immutable starter template. Each new user receives an independent copy in
// user_categories/user_products. Settings edits only that user's database rows.
// Historical selected flags in the seed are intentionally NOT copied: a new
// user's shopping list starts empty.
// ---------------------------------------------------------------------------

export const TINTS = {
  peach: "#FBEDE3",
  mint: "#EAF3EC",
  lilac: "#F1EDF6",
  blue: "#EAF2F8",
  butter: "#FCF3DC",
  blush: "#FBEAEA",
  mist: "#EDEFF2",
} as const;

export type SeedProduct = {
  name: string;
  quantity: number;
  unit: string;
  selected?: boolean;
};

export type SeedCategory = {
  name: string;
  icon: string;
  tint: string;
  products: SeedProduct[];
};

export const UNITS = ["g", "kg", "ml", "ltr", "pkt", "pc", "box"] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_STEP: Record<string, number> = {
  g: 50,
  kg: 1,
  ml: 100,
  ltr: 1,
  pkt: 1,
  pc: 1,
  box: 1,
};

export const QUICK_QTY: { quantity: number; unit: string; label: string }[] = [
  { quantity: 250, unit: "g", label: "250 g" },
  { quantity: 500, unit: "g", label: "500 g" },
  { quantity: 1, unit: "kg", label: "1 kg" },
  { quantity: 2, unit: "kg", label: "2 kg" },
  { quantity: 1, unit: "pkt", label: "1 pkt" },
];

export const SEED_CATALOG: SeedCategory[] = [
  {
    name: "Dals",
    icon: "dals",
    tint: TINTS.peach,
    products: [
      { name: "Moong Dal", quantity: 1, unit: "kg" },
      { name: "Moong Chilka Dal", quantity: 1, unit: "kg" },
      { name: "Sabut Moong", quantity: 500, unit: "g" },
      { name: "Toor Dal", quantity: 2, unit: "kg", selected: true },
      { name: "Masoor Dal", quantity: 1, unit: "kg" },
      { name: "Urad Dal", quantity: 1, unit: "kg" },
      { name: "Chana Dal", quantity: 1, unit: "kg" },
      { name: "Rajma", quantity: 1, unit: "kg", selected: true },
      { name: "Black Chana", quantity: 500, unit: "g" },
      { name: "White Chana (Chhole)", quantity: 2, unit: "kg" },
    ],
  },
  {
    name: "Spices",
    icon: "spice",
    tint: TINTS.mint,
    products: [
      { name: "Jeera", quantity: 100, unit: "g", selected: true },
      { name: "Ajwain", quantity: 100, unit: "g" },
      { name: "Haldi", quantity: 200, unit: "g", selected: true },
      { name: "Red Chilli Powder", quantity: 200, unit: "g" },
      { name: "Dhania Powder", quantity: 200, unit: "g" },
      { name: "Garam Masala", quantity: 100, unit: "g" },
      { name: "Mustard Seeds", quantity: 100, unit: "g" },
      { name: "Black Pepper", quantity: 50, unit: "g" },
    ],
  },
  {
    name: "Flour & Sweeteners",
    icon: "flour",
    tint: TINTS.lilac,
    products: [
      { name: "Rice", quantity: 5, unit: "kg" },
      { name: "Atta", quantity: 5, unit: "kg", selected: true },
      { name: "Maida", quantity: 1, unit: "kg" },
      { name: "Sooji", quantity: 1, unit: "kg" },
      { name: "Besan", quantity: 500, unit: "g" },
      { name: "Sugar", quantity: 1, unit: "kg", selected: true },
      { name: "Jaggery", quantity: 500, unit: "g" },
      { name: "Honey", quantity: 1, unit: "pc" },
      { name: "Cornflour", quantity: 250, unit: "g" },
    ],
  },
  {
    name: "Powders / Masalas / Salt",
    icon: "chilli",
    tint: TINTS.blush,
    products: [
      { name: "Salt", quantity: 1, unit: "kg", selected: true },
      { name: "Hing", quantity: 1, unit: "pc" },
      { name: "Amchur", quantity: 100, unit: "g" },
      { name: "Chaat Masala", quantity: 1, unit: "pc" },
      { name: "Kitchen King Masala", quantity: 1, unit: "pc" },
      { name: "Sambar Powder", quantity: 200, unit: "g" },
    ],
  },
  {
    name: "Breakfast Items",
    icon: "bowl",
    tint: TINTS.butter,
    products: [
      { name: "Poha", quantity: 500, unit: "g" },
      { name: "Upma Rava", quantity: 1, unit: "kg" },
      { name: "Oats", quantity: 1, unit: "box" },
      { name: "Cornflakes", quantity: 1, unit: "box" },
      { name: "Bread", quantity: 1, unit: "pc" },
      { name: "Butter", quantity: 500, unit: "g" },
      { name: "Eggs", quantity: 1, unit: "box" },
    ],
  },
  {
    name: "Fresh / General Items",
    icon: "apple",
    tint: TINTS.mint,
    products: [
      { name: "Onion", quantity: 2, unit: "kg", selected: true },
      { name: "Tomato", quantity: 1, unit: "kg" },
      { name: "Potato", quantity: 2, unit: "kg" },
      { name: "Green Chilli", quantity: 250, unit: "g" },
      { name: "Ginger", quantity: 250, unit: "g" },
      { name: "Garlic", quantity: 250, unit: "g" },
      { name: "Coriander", quantity: 1, unit: "pkt" },
      { name: "Curd", quantity: 1, unit: "pkt" },
      { name: "Milk", quantity: 1, unit: "ltr" },
    ],
  },
  {
    name: "Cleaning & Bathing",
    icon: "soap",
    tint: TINTS.blue,
    products: [
      { name: "Detergent", quantity: 2, unit: "pkt" },
      { name: "Dish Wash Bar", quantity: 2, unit: "pc" },
      { name: "Phenyl", quantity: 1, unit: "ltr" },
      { name: "Floor Cleaner", quantity: 1, unit: "ltr" },
      { name: "Shampoo", quantity: 1, unit: "pc" },
      { name: "Hand Wash", quantity: 1, unit: "pc" },
      { name: "Toothpaste", quantity: 2, unit: "pc" },
      { name: "Soap Bar", quantity: 4, unit: "pc" },
    ],
  },
  {
    name: "Cooking Oil",
    icon: "oil",
    tint: TINTS.butter,
    products: [
      { name: "Oil", quantity: 1, unit: "ltr" },
      { name: "Refined Oil", quantity: 1, unit: "ltr", selected: true },
      { name: "Ghee", quantity: 500, unit: "g" },
      { name: "Mustard Oil", quantity: 1, unit: "ltr" },
      { name: "Sunflower Oil", quantity: 1, unit: "ltr" },
      { name: "Coconut Oil", quantity: 500, unit: "ml" },
    ],
  },
  {
    name: "Tea & Snacks",
    icon: "cup",
    tint: TINTS.blush,
    products: [
      { name: "Tea", quantity: 250, unit: "g" },
      { name: "Coffee", quantity: 200, unit: "g" },
      { name: "Peanuts", quantity: 500, unit: "g" },
      { name: "Makhana", quantity: 250, unit: "g" },
      { name: "Biscuits", quantity: 3, unit: "pkt" },
      { name: "Namkeen", quantity: 2, unit: "pkt" },
    ],
  },
  {
    name: "Other Items",
    icon: "grid",
    tint: TINTS.mist,
    products: [
      { name: "Matchbox", quantity: 3, unit: "pc" },
      { name: "Candle", quantity: 2, unit: "pc" },
      { name: "Trash Bags", quantity: 1, unit: "pkt" },
      { name: "Foil Paper", quantity: 1, unit: "pc" },
      { name: "Batteries", quantity: 1, unit: "box" },
      { name: "Broom", quantity: 1, unit: "pc" },
    ],
  },
];
