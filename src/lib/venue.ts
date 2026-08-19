import { bills, type VenueBill } from "./bills";

export type FloorTable = {
  number: string;
  seats: number;
  billCode?: string;
};

export type VenueProfile = {
  slug: string;
  name: string;
  area: string;
  pos: string;
  server: string;
  tables: FloorTable[];
};

export const venues: VenueProfile[] = [
  {
    slug: "qahwa",
    name: "Qahwa Al Qurum",
    area: "Qurum, Muscat",
    pos: "Foodics",
    server: "Noor",
    tables: [
      { number: "1", seats: 2 },
      { number: "2", seats: 2 },
      { number: "3", seats: 2, billCode: "qahwa-3" },
      { number: "4", seats: 4 },
      { number: "5", seats: 4 },
      { number: "6", seats: 2 },
      { number: "7", seats: 4, billCode: "qahwa-7" },
      { number: "8", seats: 4 },
      { number: "9", seats: 2 },
      { number: "10", seats: 6 },
    ],
  },
];

export function findVenue(slug: string) {
  return venues.find((v) => v.slug === slug);
}

export function findPayTarget(code: string) {
  const n = code.trim().toLowerCase();
  for (const venue of venues) {
    for (const table of venue.tables) {
      if (tablePayCode(venue, table) === n) return { venue, table };
    }
  }
  return undefined;
}

export function emptyBill(venue: VenueProfile, table: FloorTable): VenueBill {
  return {
    code: tablePayCode(venue, table),
    venue: venue.name,
    venueArea: venue.area,
    table: table.number,
    server: venue.server,
    coverUrl: "/images/hero-4.jpg",
    vatRate: 0.05,
    pos: "demo",
    items: [],
  };
}

export function billForTable(table: FloorTable): VenueBill | undefined {
  if (!table.billCode) return undefined;
  return bills.find((b) => b.code === table.billCode);
}

export function venueBills(venue: VenueProfile): VenueBill[] {
  return venue.tables
    .map((t) => billForTable(t))
    .filter((b): b is VenueBill => Boolean(b));
}

/** Stable guest URL for a table. The QR never changes; only the open check behind it does. */
export function tablePayCode(venue: VenueProfile, table: FloorTable): string {
  return table.billCode || `${venue.slug}-${table.number}`;
}
