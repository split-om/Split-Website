import { NextResponse } from "next/server";

/**
 * Amwal Pay (and future gateways) post settlement here.
 * Verify secureHashValue before marking a table paid.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  console.info("[split:pay:webhook]", payload);
  return NextResponse.json({ received: true, provider: "amwal" });
}
