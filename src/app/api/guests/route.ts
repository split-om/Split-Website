import { NextResponse } from "next/server";
import { attachGuest, listCustomers, upsertCustomer } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venue = searchParams.get("venue");
  if (!venue) return NextResponse.json({ error: "Need venue." }, { status: 400 });
  return NextResponse.json({ guests: await listCustomers(venue, searchParams.get("q") || undefined) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug?: string;
    name?: string;
    phone?: string;
    code?: string;
  };
  if (!body.slug || !body.name || !body.phone) {
    return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
  }
  if (body.code) {
    const result = await attachGuest(body.code, body.slug, body.name, body.phone);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true, guest: result });
  }
  const guest = await upsertCustomer(body.slug, body.name, body.phone);
  if ("error" in guest) return NextResponse.json(guest, { status: 400 });
  return NextResponse.json({ ok: true, guest });
}
