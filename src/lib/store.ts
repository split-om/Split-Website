import { useDb } from "@/lib/db";
import * as file from "@/lib/sync-store";
import * as pg from "@/lib/pg-store";
import type { VenueBill } from "@/lib/bills";
import type { PayRecord } from "@/lib/pay-session";
import type { StaffAlert } from "@/lib/staff-alerts";
import type { JoinApplication } from "@/lib/join";
import type { MenuItem } from "@/lib/menu";
import type { StaffAccess } from "@/lib/staff-types";
import { emptyBill, findPayTarget as catalogTarget, findVenue as catalogVenue, venues as catalog, tablePayCode, type VenueProfile } from "@/lib/venue";
import { remainingBaisa } from "@/lib/pay-session";
import { billFoodTotal } from "@/lib/bills";

export async function resolveVenue(slug: string): Promise<VenueProfile | undefined> {
  if (useDb()) return pg.getVenue(slug);
  return catalogVenue(slug);
}

export async function listVenues(): Promise<VenueProfile[]> {
  if (useDb()) return pg.listVenues();
  return catalog;
}

export async function resolvePayTarget(code: string) {
  if (useDb()) return pg.findPayTarget(code);
  return catalogTarget(code);
}

export async function getCheck(code: string) {
  return useDb() ? pg.getCheck(code) : file.getCheck(code);
}

export async function saveCheck(bill: VenueBill) {
  return useDb() ? pg.saveCheck(bill) : file.saveCheck(bill);
}

export async function clearCheck(code: string) {
  return useDb() ? pg.clearCheck(code) : file.clearCheck(code);
}

export async function appendCheckItems(
  base: VenueBill,
  incoming: Array<{ name: string; qty: number; unitBaisa: number; detail?: string }>,
) {
  return useDb() ? pg.appendCheckItems(base, incoming) : file.appendCheckItems(base, incoming);
}

export async function getSession(code: string) {
  return useDb() ? pg.getSession(code) : file.getSession(code);
}

export async function getAlerts(venue?: string) {
  return useDb() ? pg.getAlerts(venue) : file.getAlerts(venue);
}

export async function recordPayment(code: string, payment: Omit<PayRecord, "id" | "at">) {
  return useDb() ? pg.recordPayment(code, payment) : file.recordPayment(code, payment);
}

export async function recordAlert(input: Omit<StaffAlert, "id" | "at" | "ack">) {
  return useDb() ? pg.recordAlert(input) : file.recordAlert(input);
}

export async function ackStoredAlert(id: string) {
  return useDb() ? pg.ackStoredAlert(id) : file.ackStoredAlert(id);
}

export async function resetStored(code: string) {
  return useDb() ? pg.resetStored(code) : file.resetStored(code);
}

export async function recordApplication(app: JoinApplication) {
  return useDb() ? pg.recordApplication(app) : file.recordApplication(app);
}

export async function listApplications() {
  return useDb() ? pg.listApplications() : file.listApplications();
}

export async function getVenueMenu(slug: string) {
  return useDb() ? pg.getVenueMenu(slug) : file.getVenueMenu(slug);
}

export async function saveVenueMenu(slug: string, items: MenuItem[]) {
  return useDb() ? pg.saveVenueMenu(slug, items) : file.saveVenueMenu(slug, items);
}

export async function listStaff(slug: string) {
  return useDb() ? pg.listStaff(slug) : file.listStaff(slug);
}

export async function loginStaff(slug: string, name: string, password: string) {
  return useDb() ? pg.loginStaff(slug, name, password) : file.loginStaff(slug, name, password);
}

export async function staffFromToken(token: string) {
  return useDb() ? pg.staffFromToken(token) : file.staffFromToken(token);
}

export async function logoutStaff(token: string) {
  return useDb() ? pg.logoutStaff(token) : file.logoutStaff(token);
}

export async function upsertStaff(
  slug: string,
  input: { id?: string; name: string; password?: string; access: StaffAccess },
) {
  return useDb() ? pg.upsertStaff(slug, input) : file.upsertStaff(slug, input);
}

export async function removeStaff(slug: string, id: string) {
  return useDb() ? pg.removeStaff(slug, id) : file.removeStaff(slug, id);
}

export async function hqSnapshot() {
  return useDb() ? pg.hqSnapshot() : file.hqSnapshot();
}

export async function approveApplication(id: string) {
  if (useDb()) return pg.approveApplication(id);
  return { error: "Approving a café needs the Neon database (DATABASE_URL)." };
}

export async function saveMenuPhoto(slug: string, mime: string, bytes: Buffer) {
  if (useDb()) return pg.saveMenuPhoto(slug, mime, bytes);
  return null;
}

export async function getMenuPhoto(id: string) {
  if (useDb()) return pg.getMenuPhoto(id);
  return null;
}

export async function getTillSnapshot(slug: string) {
  const venue = await resolveVenue(slug);
  if (!venue) return null;
  const checks: Record<string, VenueBill> = {};
  const tables: Record<string, { table: string; hasCheck: boolean; paidBaisa: number; remaining: number; food: number }> = {};
  for (const table of venue.tables) {
    const code = tablePayCode(venue, table);
    const bill = await getCheck(code);
    const session = await getSession(code);
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

export function shellBill(venue: VenueProfile, table: { number: string; seats: number; billCode?: string }) {
  return emptyBill(venue, table);
}
