import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { emptySession, type HqPayment, type PayRecord, type TableSession } from "@/lib/pay-session";
import type { StaffAlert } from "@/lib/staff-alerts";
import type { JoinApplication } from "@/lib/join";
import { findBill, type VenueBill } from "@/lib/bills";
import { newId } from "@/lib/id";

type Store = {
  sessions: Record<string, TableSession>;
  alerts: StaffAlert[];
  applications: JoinApplication[];
  checks: Record<string, VenueBill>;
};

const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "sync.json");

function empty(): Store {
  return { sessions: {}, alerts: [], applications: [], checks: {} };
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
