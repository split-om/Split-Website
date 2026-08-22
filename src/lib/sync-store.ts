import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { emptySession, type HqPayment, type PayRecord, type TableSession } from "@/lib/pay-session";
import type { StaffAlert } from "@/lib/staff-alerts";
import type { JoinApplication } from "@/lib/join";
import { findBill, type VenueBill } from "@/lib/bills";
import { newId } from "@/lib/id";
import { menuForVenue, type MenuItem } from "@/lib/menu";
import { hashPassword, newToken, seedStaff } from "@/lib/staff";
import { toPublic, type StaffAccess, type StaffPublic, type StaffToken, type StaffUser } from "@/lib/staff-types";
import { normalizePhone, type GuestAccount, type StoredReceipt } from "@/lib/guests";

type Store = {
  sessions: Record<string, TableSession>;
  alerts: StaffAlert[];
  applications: JoinApplication[];
  checks: Record<string, VenueBill>;
  staff: StaffUser[];
  menus: Record<string, MenuItem[]>;
  staffTokens: StaffToken[];
  customers: GuestAccount[];
  receipts: StoredReceipt[];
};

const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "sync.json");

function empty(): Store {
  return {
    sessions: {},
    alerts: [],
    applications: [],
    checks: {},
    staff: [],
    menus: {},
    staffTokens: [],
    customers: [],
    receipts: [],
  };
}

function read(): Store {
  try {
    if (!existsSync(FILE)) return empty();
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Store;
    return {
      sessions: parsed.sessions ?? {},
      alerts: parsed.alerts ?? [],
      applications: parsed.applications ?? [],
      checks: parsed.checks ?? {},
      staff: parsed.staff ?? [],
      menus: parsed.menus ?? {},
      staffTokens: parsed.staffTokens ?? [],
      customers: parsed.customers ?? [],
      receipts: parsed.receipts ?? [],
    };
  } catch {
    return empty();
  }
}

function write(store: Store) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(store), "utf8");
}

export function getCheck(code: string): VenueBill | undefined {
  return read().checks[code] ?? findBill(code);
}

export function saveCheck(bill: VenueBill) {
  const store = read();
  store.checks[bill.code] = bill;
  write(store);
}

export function appendCheckItems(
  base: VenueBill,
  incoming: Array<{ name: string; qty: number; unitBaisa: number; detail?: string }>,
): VenueBill {
  const items = base.items.map((i) => ({ ...i }));
  for (const add of incoming) {
    if (!add.name.trim() || add.qty <= 0 || add.unitBaisa <= 0) continue;
    const hit = items.find((i) => i.name === add.name && i.unitBaisa === add.unitBaisa);
    if (hit) hit.qty += add.qty;
    else {
      items.push({
        id: `g${Date.now().toString(36)}${items.length}`,
        name: add.name.trim(),
        detail: add.detail,
        qty: add.qty,
        unitBaisa: add.unitBaisa,
      });
    }
  }
  const next = { ...base, items };
  saveCheck(next);
  return next;
}

export function clearCheck(code: string) {
  const store = read();
  delete store.checks[code];
  write(store);
}

export function getSession(code: string): TableSession {
  return read().sessions[code] ?? emptySession(code);
}

export function getAlerts(venue?: string): StaffAlert[] {
  const alerts = read().alerts;
  if (!venue) return alerts;
  return alerts.filter((a) => a.venue === venue);
}

export function recordPayment(code: string, payment: Omit<PayRecord, "id" | "at">): TableSession {
  const store = read();
  const session = store.sessions[code] ?? emptySession(code);
  const next: TableSession = {
    ...session,
    paidBaisa: session.paidBaisa + payment.billBaisa,
    paidFeeBaisa: session.paidFeeBaisa + payment.feeBaisa,
    payments: [
      ...session.payments,
      { ...payment, id: newId(), at: new Date().toISOString() },
    ],
  };
  store.sessions[code] = next;
  write(store);
  return next;
}

export function recordAlert(input: Omit<StaffAlert, "id" | "at" | "ack">): StaffAlert {
  const store = read();
  const alert: StaffAlert = {
    ...input,
    id: newId(),
    at: new Date().toISOString(),
    ack: false,
  };
  store.alerts = [alert, ...store.alerts].slice(0, 50);
  write(store);
  return alert;
}

export function ackStoredAlert(id: string) {
  const store = read();
  store.alerts = store.alerts.map((a) => (a.id === id ? { ...a, ack: true } : a));
  write(store);
}

export function resetStored(code: string): TableSession {
  const store = read();
  const empty = emptySession(code);
  store.sessions[code] = empty;
  store.alerts = store.alerts.filter((a) => a.code !== code);
  write(store);
  return empty;
}

export function recordApplication(app: JoinApplication) {
  const store = read();
  store.applications = [app, ...store.applications.filter((a) => a.id !== app.id)];
  write(store);
}

export function listApplications(): JoinApplication[] {
  return read().applications;
}

export function getVenueMenu(slug: string): MenuItem[] {
  return read().menus[slug] ?? menuForVenue(slug);
}

export function saveVenueMenu(slug: string, items: MenuItem[]) {
  const store = read();
  store.menus[slug] = items;
  write(store);
}

function ensureStaff(store: Store, slug: string) {
  if (!store.staff.some((u) => u.slug === slug)) {
    store.staff = [...store.staff, ...seedStaff(slug)];
    write(store);
  }
}

export function listStaff(slug: string): StaffUser[] {
  const store = read();
  ensureStaff(store, slug);
  return read().staff.filter((u) => u.slug === slug);
}

export function loginStaff(slug: string, name: string, password: string): { user: StaffPublic; token: string } | null {
  const users = listStaff(slug);
  const want = name.trim().toLowerCase();
  const user = users.find((u) => u.name.trim().toLowerCase() === want);
  if (!user || user.passwordHash !== hashPassword(password)) return null;
  const token = newToken();
  const store = read();
  store.staffTokens = [
    { token, slug, userId: user.id, at: new Date().toISOString() },
    ...store.staffTokens.filter((t) => !(t.slug === slug && t.userId === user.id)),
  ].slice(0, 80);
  write(store);
  return { user: toPublic(user), token };
}

export function staffFromToken(token: string): StaffUser | null {
  if (!token) return null;
  const store = read();
  const row = store.staffTokens.find((t) => t.token === token);
  if (!row) return null;
  ensureStaff(store, row.slug);
  return read().staff.find((u) => u.id === row.userId && u.slug === row.slug) ?? null;
}

export function logoutStaff(token: string) {
  const store = read();
  store.staffTokens = store.staffTokens.filter((t) => t.token !== token);
  write(store);
}

export function upsertStaff(
  slug: string,
  input: { id?: string; name: string; password?: string; access: StaffAccess },
): StaffUser | { error: string } {
  const store = read();
  ensureStaff(store, slug);
  const fresh = read();
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };
  if (input.id) {
    const i = fresh.staff.findIndex((u) => u.id === input.id && u.slug === slug);
    if (i < 0) return { error: "Unknown person." };
    const cur = fresh.staff[i];
    if (fresh.staff.some((u) => u.slug === slug && u.id !== cur.id && u.name.toLowerCase() === name.toLowerCase())) {
      return { error: "That name is already used." };
    }
    fresh.staff[i] = {
      ...cur,
      name,
      access: cur.locked ? { ...cur.access, ...input.access, people: true, menu: true } : input.access,
      passwordHash: input.password?.trim() ? hashPassword(input.password) : cur.passwordHash,
    };
    write(fresh);
    return fresh.staff[i];
  }
  if (!input.password?.trim()) return { error: "Set a password for this person." };
  if (fresh.staff.some((u) => u.slug === slug && u.name.toLowerCase() === name.toLowerCase())) {
    return { error: "That name is already used." };
  }
  const user: StaffUser = {
    id: newId(),
    slug,
    name,
    passwordHash: hashPassword(input.password),
    access: input.access,
  };
  fresh.staff.push(user);
  write(fresh);
  return user;
}

export function removeStaff(slug: string, id: string): { error: string } | { ok: true } {
  const store = read();
  const user = store.staff.find((u) => u.id === id && u.slug === slug);
  if (!user) return { error: "Unknown person." };
  if (user.locked) return { error: "The owner account cannot be removed." };
  store.staff = store.staff.filter((u) => !(u.id === id && u.slug === slug));
  store.staffTokens = store.staffTokens.filter((t) => !(t.userId === id && t.slug === slug));
  write(store);
  return { ok: true };
}

export function hqSnapshot() {
  const store = read();
  const payments: HqPayment[] = [];
  for (const [code, session] of Object.entries(store.sessions)) {
    const bill = findBill(code);
    for (const p of session.payments) {
      payments.push({
        ...p,
        code,
        venue: bill?.venue ?? code,
        table: bill?.table ?? "—",
      });
    }
  }
  payments.sort((a, b) => (a.at < b.at ? 1 : -1));

  const fee = payments.reduce((s, p) => s + p.feeBaisa, 0);
  const tips = payments.reduce((s, p) => s + p.tipBaisa, 0);
  const gmv = payments.reduce((s, p) => s + p.billBaisa, 0);
  const byVenue = new Map<string, { venue: string; pays: number; fee: number; gmv: number; last?: string }>();
  for (const p of payments) {
    const cur = byVenue.get(p.venue) ?? { venue: p.venue, pays: 0, fee: 0, gmv: 0 };
    cur.pays += 1;
    cur.fee += p.feeBaisa;
    cur.gmv += p.billBaisa;
    if (!cur.last || p.at > cur.last) cur.last = p.at;
    byVenue.set(p.venue, cur);
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = payments.filter((p) => new Date(p.at) >= startOfDay);

  return {
    payments,
    applications: store.applications,
    totals: {
      fee,
      tips,
      gmv,
      count: payments.length,
      todayFee: today.reduce((s, p) => s + p.feeBaisa, 0),
      todayCount: today.length,
      todayGmv: today.reduce((s, p) => s + p.billBaisa, 0),
    },
    venues: [...byVenue.values()].sort((a, b) => b.fee - a.fee),
  };
}

export function upsertCustomer(slug: string, name: string, phone: string): GuestAccount | { error: string } {
  const n = name.trim();
  const p = normalizePhone(phone);
  if (!n) return { error: "Name is required." };
  if (p.length < 8) return { error: "Enter a phone number." };
  const store = read();
  const hit = store.customers.find((c) => c.slug === slug && c.phone === p);
  if (hit) {
    hit.name = n;
    write(store);
    return hit;
  }
  const guest: GuestAccount = { id: newId(), slug, name: n, phone: p };
  store.customers = [guest, ...store.customers];
  write(store);
  return guest;
}

export function listCustomers(slug: string, q?: string): GuestAccount[] {
  const rows = read().customers.filter((c) => c.slug === slug);
  const needle = (q || "").trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((g) => g.name.toLowerCase().includes(needle) || g.phone.includes(needle.replace(/\D/g, "")));
}

export function findCustomer(slug: string, phone: string): GuestAccount | null {
  const p = normalizePhone(phone);
  if (!p) return null;
  return read().customers.find((c) => c.slug === slug && c.phone === p) ?? null;
}

export function saveReceipt(receipt: StoredReceipt) {
  const store = read();
  store.receipts = [receipt, ...store.receipts.filter((r) => r.id !== receipt.id)].slice(0, 200);
  write(store);
}

export function listReceipts(slug: string): StoredReceipt[] {
  return read().receipts.filter((r) => r.slug === slug).slice(0, 80);
}

export function getReceipt(id: string): StoredReceipt | null {
  return read().receipts.find((r) => r.id === id) ?? null;
}
