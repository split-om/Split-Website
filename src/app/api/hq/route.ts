import { NextResponse } from "next/server";
import { hqSnapshot, recordApplication } from "@/lib/sync-store";
import type { JoinApplication } from "@/lib/join";

export async function GET() {
  return NextResponse.json(hqSnapshot());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { application?: JoinApplication };
  if (!body.application?.id) {
    return NextResponse.json({ error: "Missing application." }, { status: 400 });
  }
  recordApplication(body.application);
  return NextResponse.json({ ok: true });
}
