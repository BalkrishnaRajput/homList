export type SheetItem = { name: string; quantity: number; unit: string };

export type SheetGroup = {
  name: string;
  icon: string;
  tint: string;
  items: SheetItem[];
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function longDate(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function fileDate(date: Date) {
  const m = MONTHS[date.getMonth()].slice(0, 3);
  return `${String(date.getDate()).padStart(2, "0")}_${m}_${date.getFullYear()}`;
}

export function pdfFilename(date: Date) {
  return `Household_Shopping_List_${fileDate(date)}.pdf`;
}

export function totalItems(groups: SheetGroup[]) {
  return groups.reduce((sum, g) => sum + g.items.length, 0);
}

/** Shared palette for the printed sheet (PDF has no CSS variables). */
export const SHEET = {
  page: "#FAF9F5",
  surface: "#FFFFFF",
  ink: "#1F2937",
  mute: "#6B7280",
  line: "#E1DACB",
  forest: "#245C39",
  leaf: "#4CAF68",
  clay: "#D97757",
  peach: "#FBEDE3",
  sage: "#DCE7D6",
};
