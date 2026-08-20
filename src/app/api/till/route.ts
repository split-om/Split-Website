import { NextResponse } from "next/server";
import type { VenueBill } from "@/lib/bills";
import { omrToBaisa } from "@/lib/money";
import {
  appendCheckItems,
  clearCheck,
  getCheck,
  getTillSnapshot,
  recordAlert,
  resolvePayTarget,
  resolveVenue,
  saveCheck,
  settleOnBankPos,
  startFreshIfSettled,
} from "@/lib/store";
import { emptyBill, tablePayCode } from "@/lib/venue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const slug = searchParams.get("venue");
  if (code) {
    const bill = await getCheck(code);
    if (!bill) {
      const target = await resolvePayTarget(code);
      if (target) return NextResponse.json({ bill: emptyBill(target.venue, target.table), empty: true });
      return NextResponse.json({ error: "No check." }, { status: 404 });
    }
    return NextResponse.json({ bill });
  }
  if (slug) {
    const snap = await getTillSnapshot(slug);
    if (!snap) return NextResponse.json({ error: "Unknown venue." }, { status: 404 });
    return NextResponse.json(snap);
  }
  return NextResponse.json({ error: "Need code or venue." }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    slug?: string;
    table?: string;
    code?: string;
    items?: Array<{ name: string; qty: number; omr: number; detail?: string }>;
    totalOmr?: number;
  };

  if (body.action === "order" && body.code && body.items?.length) {
    const target = await resolvePayTarget(body.code);
    if (!target) return NextResponse.json({ error: "Unknown table." }, { status: 404 });
    const code = tablePayCode(target.venue, target.table);
    await startFreshIfSettled(code);
    const base = (await getCheck(code)) ?? emptyBill(target.venue, target.table);
    const incoming = body.items
      .filter((i) => i.name.trim() && i.qty > 0 && i.omr > 0)
      .map((i) => ({
        name: i.name.trim(),
        qty: i.qty,
        unitBaisa: omrToBaisa(i.omr),
        detail: i.detail,
      }));
    if (!incoming.length) return NextResponse.json({ error: "Add items." }, { status: 400 });
    const bill = await appendCheckItems(base, incoming);
    const summary = incoming.map((i) => `${i.qty}× ${i.name}`).join(", ");
    await recordAlert({
      type: "order",
      code,
      table: target.table.number,
      venue: target.venue.name,
      message: `Table ${target.table.number} ordered ${summary}`,
    });
    return NextResponse.json({ ok: true, bill });
  }

  if (body.action === "clear" && body.slug && body.table) {
    const venue = await resolveVenue(body.slug);
    if (!venue) return NextResponse.json({ error: "Unknown venue." }, { status: 404 });
    const table = venue.tables.find((t) => t.number === body.table);
    if (!table) return NextResponse.json({ error: "Unknown table." }, { status: 404 });
    await clearCheck(tablePayCode(venue, table));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "pos" && body.slug && body.table) {
    const result = await settleOnBankPos(body.slug, body.table);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  if (body.action === "save" && body.slug && body.table) {
    const venue = await resolveVenue(body.slug);
    if (!venue) return NextResponse.json({ error: "Unknown venue." }, { status: 404 });
    const table = venue.tables.find((t) => t.number === body.table);
    if (!table) return NextResponse.json({ error: "Unknown table." }, { status: 404 });
    const code = tablePayCode(venue, table);
    await startFreshIfSettled(code);

    let items = (body.items ?? [])
      .filter((i) => i.name.trim() && i.qty > 0 && i.omr > 0)
      .map((i, n) => ({
        id: `t${n}`,
        name: i.name.trim(),
        qty: i.qty,
        unitBaisa: omrToBaisa(i.omr),
      }));

    if (!items.length && body.totalOmr && body.totalOmr > 0) {
      items = [{ id: "total", name: "Table total", qty: 1, unitBaisa: omrToBaisa(body.totalOmr) }];
    }
    if (!items.length) {
      return NextResponse.json({ error: "Add items or a total." }, { status: 400 });
    }

    const bill: VenueBill = {
      code,
      venue: venue.name,
      venueArea: venue.area,
      table: table.number,
      server: venue.server,
      coverUrl: "/images/hero-4.jpg",
      vatRate: 0.05,
      pos: "demo",
      items,
    };
    await saveCheck(bill);
    return NextResponse.json({ ok: true, bill });
  }

  return NextResponse.json({ error: "Bad till request." }, { status: 400 });
}
