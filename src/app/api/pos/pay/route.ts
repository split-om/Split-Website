import { NextResponse } from "next/server";
import { markSandboxPaid } from "@/lib/pos/foodics";

/** After Amwal (or restaurant) settles, tell the POS the check is paid. */
export async function POST(request: Request) {
  const body = (await request.json()) as { orderId?: string };
  if (!body.orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  const token = process.env.FOODICS_ACCESS_TOKEN?.trim();
  if (token) {
    return NextResponse.json({
      ok: true,
      mode: "live",
      message: "Would POST a payment on the Foodics order, then close the check.",
    });
  }

  markSandboxPaid(body.orderId);
  return NextResponse.json({
    ok: true,
    mode: "sandbox",
    orderId: body.orderId,
    message: "Foodics sandbox check marked paid. Kitchen/inventory stay in the POS.",
  });
}
