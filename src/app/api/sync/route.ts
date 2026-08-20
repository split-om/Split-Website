import { NextResponse } from "next/server";
import {
  ackStoredAlert,
  getAlerts,
  getSession,
  getTillSnapshot,
  recordAlert,
  recordPayment,
  resetStored,
  resolveVenue,
} from "@/lib/store";
import type { PayRecord } from "@/lib/pay-session";
import { tablePayCode } from "@/lib/venue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const slug = searchParams.get("venue");

  if (code) {
    return NextResponse.json({
      session: await getSession(code),
      alerts: (await getAlerts()).filter((a) => a.code === code && !a.ack),
    });
  }

  if (slug) {
    const venue = await resolveVenue(slug);
    if (!venue) return NextResponse.json({ error: "Unknown venue." }, { status: 404 });
    const sessions: Record<string, Awaited<ReturnType<typeof getSession>>> = {};
    for (const table of venue.tables) {
      const c = tablePayCode(venue, table);
      sessions[c] = await getSession(c);
    }
    const snap = await getTillSnapshot(slug);
    return NextResponse.json({
      sessions,
      alerts: await getAlerts(venue.name),
      checks: snap?.checks ?? {},
    });
  }

  return NextResponse.json({ error: "Need code or venue." }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    code?: string;
    id?: string;
    alert?: { type: "waiter" | "restaurant-pay" | "order"; table: string; venue: string; message: string };
    payment?: Omit<PayRecord, "id" | "at">;
  };

  if (body.action === "waiter" && body.code && body.alert) {
    const alert = await recordAlert({ ...body.alert, code: body.code });
    return NextResponse.json({ ok: true, alert });
  }

  if (body.action === "pay" && body.code && body.payment) {
    const session = await recordPayment(body.code, body.payment);
    return NextResponse.json({ ok: true, session });
  }

  if (body.action === "ack" && body.id) {
    await ackStoredAlert(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reset" && body.code) {
    const session = await resetStored(body.code);
    return NextResponse.json({ ok: true, session });
  }

  return NextResponse.json({ error: "Bad sync request." }, { status: 400 });
}
