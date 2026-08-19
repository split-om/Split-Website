import { billFoodTotal, type VenueBill } from "@/lib/bills";
import { remainingBaisa } from "@/lib/pay-session";
import { getCheck, getSession } from "@/lib/sync-store";
import { findVenue, tablePayCode } from "@/lib/venue";

export type TillTableMeta = {
  table: string;
  hasCheck: boolean;
  paidBaisa: number;
  remaining: number;
  food: number;
};

export function getTillSnapshot(slug: string) {
  const venue = findVenue(slug);
  if (!venue) return null;
  const checks: Record<string, VenueBill> = {};
  const tables: Record<string, TillTableMeta> = {};
  for (const table of venue.tables) {
    const code = tablePayCode(venue, table);
    const bill = getCheck(code);
    const session = getSession(code);
    if (bill) checks[code] = bill;
    tables[code] = {
      table: table.number,
      hasCheck: Boolean(bill),
      paidBaisa: session.paidBaisa,
      remaining: bill ? remainingBaisa(bill, session) : 0,
      food: bill ? billFoodTotal(bill) : 0,
    };
  }
  return { checks, tables };
}
