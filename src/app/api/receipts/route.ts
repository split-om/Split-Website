import { NextResponse } from "next/server";
import { getStoredReceipt, listReceipts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const venue = searchParams.get("venue");
  if (id) {
    const receipt = await getStoredReceipt(id);
    if (!receipt) return NextResponse.json({ error: "Unknown receipt." }, { status: 404 });
    return NextResponse.json({ receipt });
  }
  if (!venue) return NextResponse.json({ error: "Need venue." }, { status: 400 });
  return NextResponse.json({ receipts: await listReceipts(venue) });
}
