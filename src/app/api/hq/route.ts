import { NextResponse } from "next/server";
import { approveApplication, hqSnapshot, recordApplication } from "@/lib/store";
import type { JoinApplication } from "@/lib/join";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await hqSnapshot());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    application?: JoinApplication;
    action?: string;
    id?: string;
  };
  if (body.action === "approve" && body.id) {
    const result = await approveApplication(body.id);
    if ("error" in result && result.error) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true, ...result });
  }
  if (!body.application?.id) {
    return NextResponse.json({ error: "Missing application." }, { status: 400 });
  }
  await recordApplication(body.application);
  return NextResponse.json({ ok: true });
}
