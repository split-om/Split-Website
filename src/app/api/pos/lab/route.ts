import { NextResponse } from "next/server";
import {
  findPos,
  labConnect,
  labFetch,
  labMarkPaid,
  labSendOrder,
  labSnapshot,
  posSystems,
  type PosId,
} from "@/lib/pos/lab";

export async function GET() {
  return NextResponse.json({ systems: posSystems, lab: labSnapshot() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; pos?: PosId };
  const pos = body.pos;
  if (!pos || !findPos(pos)) {
    return NextResponse.json({ error: "Pick a POS." }, { status: 400 });
  }
  try {
    if (body.action === "connect") {
      return NextResponse.json({ ok: true, lab: labConnect(pos) });
    }
    if (body.action === "fetch") {
      return NextResponse.json({ ok: true, ...labFetch(pos) });
    }
    if (body.action === "pay") {
      return NextResponse.json({ ok: true, lab: labMarkPaid(pos) });
    }
    if (body.action === "order") {
      return NextResponse.json({ ok: true, lab: labSendOrder(pos) });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "POS lab error." }, { status: 400 });
  }
}
