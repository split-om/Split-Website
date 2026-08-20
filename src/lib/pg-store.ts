import { emptySession, type HqPayment, type PayRecord, type TableSession } from "@/lib/pay-session";
import type { StaffAlert } from "@/lib/staff-alerts";
import type { JoinApplication } from "@/lib/join";
import { findBill, type VenueBill } from "@/lib/bills";
import { newId } from "@/lib/id";
import { menuForVenue, type MenuItem } from "@/lib/menu";
import { hashPassword, newToken, seedStaff } from "@/lib/staff";
import { ALL_ACCESS, toPublic, type StaffAccess, type StaffPublic, type StaffUser } from "@/lib/staff-types";
import { ensureSchema, getSql } from "@/lib/db";
import { venues as catalog, type FloorTable, type VenueProfile } from "@/lib/venue";
import { slugifyName, tableCountFromRange } from "@/lib/slug";

async function db() {
  const sql = await ensureSchema();
  if (!sql) throw new Error("DATABASE_URL is missing.");
  return sql;
}

export async function seedCatalog() {
  const sql = await db();
  for (const v of catalog) {
    await sql`INSERT INTO venues (slug, name, area, pos, server)
      VALUES (${v.slug}, ${v.name}, ${v.area}, ${v.pos}, ${v.server})
      ON CONFLICT (slug) DO NOTHING`;
    for (const t of v.tables) {
      await sql`INSERT INTO venue_tables (slug, number, seats, bill_code)
        VALUES (${v.slug}, ${t.number}, ${t.seats}, ${t.billCode ?? null})
        ON CONFLICT (slug, number) DO NOTHING`;
    }
  }
}

export async function getVenue(slug: string): Promise<VenueProfile | undefined> {
  const sql = await db();
  await seedCatalog();
  const rows = await sql`SELECT slug, name, area, pos, server FROM venues WHERE slug = ${slug}`;
  const row = rows[0] as { slug: string; name: string; area: string; pos: string; server: string } | undefined;
  if (!row) return undefined;
  const tables = (await sql`SELECT number, seats, bill_code FROM venue_tables WHERE slug = ${slug} ORDER BY number`) as Array<{
    number: string;
    seats: number;
    bill_code: string | null;
  }>;
  return {
    slug: row.slug,
    name: row.name,
    area: row.area,
    pos: row.pos,
    server: row.server,
    tables: tables.map((t) => ({
      number: t.number,
      seats: t.seats,
      billCode: t.bill_code || undefined,
    })),
  };
}

export async function listVenues(): Promise<VenueProfile[]> {
  const sql = await db();
  await seedCatalog();
  const rows = (await sql`SELECT slug FROM venues ORDER BY name`) as Array<{ slug: string }>;
  const out: VenueProfile[] = [];
  for (const r of rows) {
    const v = await getVenue(r.slug);
    if (v) out.push(v);
  }
  return out;
}

export async function findPayTarget(code: string) {
  const n = code.trim().toLowerCase();
  const all = await listVenues();
  for (const venue of all) {
    for (const table of venue.tables) {
      const c = table.billCode || `${venue.slug}-${table.number}`;
      if (c === n) return { venue, table };
    }
  }
  return undefined;
}

export async function getCheck(code: string): Promise<VenueBill | undefined> {
  const sql = await db();
  const rows = await sql`SELECT bill FROM checks WHERE code = ${code}`;
  if (rows[0]) return rows[0].bill as VenueBill;
  return findBill(code);
}

export async function saveCheck(bill: VenueBill) {
  const sql = await db();
  await sql`INSERT INTO checks (code, bill) VALUES (${bill.code}, ${bill as never})
    ON CONFLICT (code) DO UPDATE SET bill = EXCLUDED.bill`;
}

export async function clearCheck(code: string) {
  const sql = await db();
  await sql`DELETE FROM checks WHERE code = ${code}`;
}

export async function appendCheckItems(
  base: VenueBill,
  incoming: Array<{ name: string; qty: number; unitBaisa: number; detail?: string }>,
): Promise<VenueBill> {
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
  await saveCheck(next);
  return next;
}

export async function getSession(code: string): Promise<TableSession> {
  const sql = await db();
  const rows = await sql`SELECT session FROM pay_sessions WHERE code = ${code}`;
  if (rows[0]) return rows[0].session as TableSession;
  return emptySession(code);
}

export async function getAlerts(venue?: string): Promise<StaffAlert[]> {
  const sql = await db();
  const rows = await sql`SELECT payload FROM alerts ORDER BY created_at DESC LIMIT 50`;
  const alerts = rows.map((r) => r.payload as StaffAlert);
  if (!venue) return alerts;
  return alerts.filter((a) => a.venue === venue);
}

export async function recordPayment(code: string, payment: Omit<PayRecord, "id" | "at">): Promise<TableSession> {
  const session = await getSession(code);
  const next: TableSession = {
    ...session,
    paidBaisa: session.paidBaisa + payment.billBaisa,
    paidFeeBaisa: session.paidFeeBaisa + payment.feeBaisa,
    payments: [
      ...session.payments,
      { ...payment, id: newId(), at: new Date().toISOString() },
    ],
  };
  const sql = await db();
  await sql`INSERT INTO pay_sessions (code, session) VALUES (${code}, ${next as never})
    ON CONFLICT (code) DO UPDATE SET session = EXCLUDED.session`;
  return next;
}

export async function recordAlert(input: Omit<StaffAlert, "id" | "at" | "ack">): Promise<StaffAlert> {
  const alert: StaffAlert = {
    ...input,
    id: newId(),
    at: new Date().toISOString(),
    ack: false,
  };
  const sql = await db();
  await sql`INSERT INTO alerts (id, payload) VALUES (${alert.id}, ${alert as never})`;
  return alert;
}

export async function ackStoredAlert(id: string) {
  const sql = await db();
  const rows = await sql`SELECT payload FROM alerts WHERE id = ${id}`;
  if (!rows[0]) return;
  const alert = { ...(rows[0].payload as StaffAlert), ack: true };
  await sql`UPDATE alerts SET payload = ${alert as never} WHERE id = ${id}`;
}

export async function resetStored(code: string): Promise<TableSession> {
  const empty = emptySession(code);
  const sql = await db();
  await sql`INSERT INTO pay_sessions (code, session) VALUES (${code}, ${empty as never})
    ON CONFLICT (code) DO UPDATE SET session = EXCLUDED.session`;
  await sql`DELETE FROM alerts WHERE payload->>'code' = ${code}`;
  return empty;
}

export async function recordApplication(app: JoinApplication) {
  const sql = await db();
  await sql`INSERT INTO applications (id, submitted_at, status, payload)
    VALUES (${app.id}, ${app.submittedAt}, ${app.status}, ${app as never})
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, status = EXCLUDED.status`;
}

export async function listApplications(): Promise<JoinApplication[]> {
  const sql = await db();
  const rows = await sql`SELECT payload, venue_slug, owner_password, status FROM applications ORDER BY submitted_at DESC`;
  return rows.map((r) => {
    const app = r.payload as JoinApplication;
    return {
      ...app,
      status: r.status as JoinApplication["status"],
      notes: r.venue_slug
        ? `${app.notes}\n\nLive café: /venue/${r.venue_slug}${r.owner_password ? ` · owner password: ${r.owner_password}` : ""}`.trim()
        : app.notes,
    };
  });
}

export async function getVenueMenu(slug: string): Promise<MenuItem[]> {
  const sql = await db();
  const rows = await sql`SELECT id, name, detail, omr, category, photo FROM menu_items WHERE slug = ${slug} ORDER BY sort, name`;
  if (!rows.length) return slug === "qahwa" ? menuForVenue("qahwa") : [];
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    detail: (r.detail as string) || undefined,
    omr: Number(r.omr),
    category: r.category as MenuItem["category"],
    photo: (r.photo as string) || undefined,
  }));
}

export async function saveVenueMenu(slug: string, items: MenuItem[]) {
  const sql = await db();
  await sql`DELETE FROM menu_items WHERE slug = ${slug}`;
  let i = 0;
  for (const item of items) {
    await sql`INSERT INTO menu_items (slug, id, name, detail, omr, category, photo, sort)
      VALUES (${slug}, ${item.id}, ${item.name}, ${item.detail ?? null}, ${item.omr}, ${item.category}, ${item.photo ?? null}, ${i})`;
    i += 1;
  }
}

export async function saveMenuPhoto(slug: string, mime: string, bytes: Buffer) {
  const sql = await db();
  const id = newId();
  await sql`INSERT INTO menu_photos (id, slug, mime, bytes) VALUES (${id}, ${slug}, ${mime}, ${bytes})`;
  return id;
}

export async function getMenuPhoto(id: string) {
  const sql = await db();
  const rows = await sql`SELECT mime, bytes FROM menu_photos WHERE id = ${id}`;
  const row = rows[0] as { mime: string; bytes: Buffer | Uint8Array } | undefined;
  if (!row) return null;
  const bytes = Buffer.isBuffer(row.bytes) ? row.bytes : Buffer.from(row.bytes);
  return { mime: row.mime, bytes };
}

async function ensureStaff(slug: string) {
  const sql = await db();
  const rows = await sql`SELECT id FROM staff_users WHERE slug = ${slug} LIMIT 1`;
  if (rows.length) return;
  if (slug !== "qahwa") return;
  for (const u of seedStaff(slug)) {
    await sql`INSERT INTO staff_users (id, slug, name, password_hash, access, locked)
      VALUES (${u.id}, ${u.slug}, ${u.name}, ${u.passwordHash}, ${u.access as never}, ${Boolean(u.locked)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

export async function listStaff(slug: string): Promise<StaffUser[]> {
  const sql = await db();
  await ensureStaff(slug);
  const rows = await sql`SELECT id, slug, name, password_hash, access, locked FROM staff_users WHERE slug = ${slug}`;
  return rows.map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    passwordHash: r.password_hash as string,
    access: r.access as StaffAccess,
    locked: Boolean(r.locked),
  }));
}

export async function loginStaff(slug: string, name: string, password: string): Promise<{ user: StaffPublic; token: string } | null> {
  const users = await listStaff(slug);
  const want = name.trim().toLowerCase();
  const user = users.find((u) => u.name.trim().toLowerCase() === want);
  if (!user || user.passwordHash !== hashPassword(password)) return null;
  const token = newToken();
  const sql = await db();
  await sql`DELETE FROM staff_tokens WHERE slug = ${slug} AND user_id = ${user.id}`;
  await sql`INSERT INTO staff_tokens (token, slug, user_id, at) VALUES (${token}, ${slug}, ${user.id}, ${new Date().toISOString()})`;
  return { user: toPublic(user), token };
}

export async function staffFromToken(token: string): Promise<StaffUser | null> {
  if (!token) return null;
  const sql = await db();
  const rows = await sql`SELECT slug, user_id FROM staff_tokens WHERE token = ${token}`;
  const row = rows[0] as { slug: string; user_id: string } | undefined;
  if (!row) return null;
  const users = await listStaff(row.slug);
  return users.find((u) => u.id === row.user_id) ?? null;
}

export async function logoutStaff(token: string) {
  const sql = await db();
  await sql`DELETE FROM staff_tokens WHERE token = ${token}`;
}

export async function upsertStaff(
  slug: string,
  input: { id?: string; name: string; password?: string; access: StaffAccess },
): Promise<StaffUser | { error: string }> {
  const users = await listStaff(slug);
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };
  const sql = await db();
  if (input.id) {
    const cur = users.find((u) => u.id === input.id);
    if (!cur) return { error: "Unknown person." };
    if (users.some((u) => u.id !== cur.id && u.name.toLowerCase() === name.toLowerCase())) {
      return { error: "That name is already used." };
    }
    const access = cur.locked ? { ...cur.access, ...input.access, people: true, menu: true } : input.access;
    const hash = input.password?.trim() ? hashPassword(input.password) : cur.passwordHash;
    await sql`UPDATE staff_users SET name = ${name}, access = ${access as never}, password_hash = ${hash} WHERE id = ${cur.id}`;
    return { ...cur, name, access, passwordHash: hash };
  }
  if (!input.password?.trim()) return { error: "Set a password for this person." };
  if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
    return { error: "That name is already used." };
  }
  const user: StaffUser = {
    id: newId(),
    slug,
    name,
    passwordHash: hashPassword(input.password),
    access: input.access,
  };
  await sql`INSERT INTO staff_users (id, slug, name, password_hash, access, locked)
    VALUES (${user.id}, ${user.slug}, ${user.name}, ${user.passwordHash}, ${user.access as never}, false)`;
  return user;
}

export async function removeStaff(slug: string, id: string): Promise<{ error: string } | { ok: true }> {
  const users = await listStaff(slug);
  const user = users.find((u) => u.id === id);
  if (!user) return { error: "Unknown person." };
  if (user.locked) return { error: "The owner account cannot be removed." };
  const sql = await db();
  await sql`DELETE FROM staff_users WHERE id = ${id} AND slug = ${slug}`;
  await sql`DELETE FROM staff_tokens WHERE user_id = ${id} AND slug = ${slug}`;
  return { ok: true };
}

export async function approveApplication(id: string) {
  const sql = await db();
  const rows = await sql`SELECT payload, status FROM applications WHERE id = ${id}`;
  if (!rows[0]) return { error: "Unknown application." };
  const app = rows[0].payload as JoinApplication;
  if (rows[0].status === "approved") {
    const again = await sql`SELECT venue_slug, owner_password FROM applications WHERE id = ${id}`;
    return {
      slug: again[0]?.venue_slug as string,
      ownerName: app.firstName,
      password: again[0]?.owner_password as string,
      already: true,
    };
  }
  await seedCatalog();
  let slug = slugifyName(app.venueName);
  const clash = await sql`SELECT slug FROM venues WHERE slug = ${slug}`;
  if (clash.length) slug = `${slug}-${id.slice(-4).toLowerCase()}`;
  const count = tableCountFromRange(app.tables);
  const tables: FloorTable[] = Array.from({ length: count }, (_, i) => ({
    number: String(i + 1),
    seats: i % 5 === 4 ? 6 : i % 2 === 0 ? 2 : 4,
  }));
  const area = [app.area, app.city].filter(Boolean).join(", ");
  await sql`INSERT INTO venues (slug, name, area, pos, server)
    VALUES (${slug}, ${app.venueName}, ${area}, ${app.pos || "tablet"}, ${app.firstName || "Staff"})`;
  for (const t of tables) {
    await sql`INSERT INTO venue_tables (slug, number, seats) VALUES (${slug}, ${t.number}, ${t.seats})`;
  }
  const password = `split${Math.floor(1000 + Math.random() * 9000)}`;
  const owner: StaffUser = {
    id: newId(),
    slug,
    name: app.firstName.trim() || "Owner",
    passwordHash: hashPassword(password),
    access: ALL_ACCESS,
    locked: true,
  };
  await sql`INSERT INTO staff_users (id, slug, name, password_hash, access, locked)
    VALUES (${owner.id}, ${owner.slug}, ${owner.name}, ${owner.passwordHash}, ${owner.access as never}, true)`;
  const starter = menuForVenue("qahwa");
  let i = 0;
  for (const item of starter) {
    await sql`INSERT INTO menu_items (slug, id, name, detail, omr, category, photo, sort)
      VALUES (${slug}, ${item.id}, ${item.name}, ${item.detail ?? null}, ${item.omr}, ${item.category}, ${null}, ${i})`;
    i += 1;
  }
  await sql`UPDATE applications SET status = ${"approved"}, venue_slug = ${slug}, owner_password = ${password} WHERE id = ${id}`;
  return { slug, ownerName: owner.name, password, tables: count, already: false };
}

export async function hqSnapshot() {
  const sql = await db();
  const sessionRows = await sql`SELECT code, session FROM pay_sessions`;
  const payments: HqPayment[] = [];
  for (const row of sessionRows) {
    const session = row.session as TableSession;
    const bill = (await getCheck(row.code as string)) ?? findBill(row.code as string);
    for (const p of session.payments ?? []) {
      payments.push({
        ...p,
        code: row.code as string,
        venue: bill?.venue ?? (row.code as string),
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
  const applications = await listApplications();
  const live = await listVenues();
  for (const v of live) {
    if (!byVenue.has(v.name)) byVenue.set(v.name, { venue: v.name, pays: 0, fee: 0, gmv: 0 });
  }
  return {
    payments,
    applications,
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
