import { NextResponse } from "next/server";
import { findBill } from "@/lib/bills";
import { createCheckout } from "@/lib/payments";
import type { PaymentMethodId } from "@/lib/payments";

type Body = {
  code?: string;
  amountBaisa?: number;
  foodBaisa?: number;
  feeBaisa?: number;
  tipBaisa?: number;
  method?: PaymentMethodId;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const bill = body.code ? findBill(body.code) : undefined;
  if (!bill) {
    return NextResponse.json({ error: "Unknown table." }, { status: 404 });
  }

  const amountBaisa = Math.round(Number(body.amountBaisa) || 0);
  const foodBaisa = Math.round(Number(body.foodBaisa) || 0);
  const feeBaisa = Math.round(Number(body.feeBaisa) || 0);
  const tipBaisa = Math.round(Number(body.tipBaisa) || 0);
  if (amountBaisa <= 0 || amountBaisa !== foodBaisa + feeBaisa + tipBaisa) {
    return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const returnUrl = `${origin}/pay/${bill.code}/return`;

  try {
    const checkout = await createCheckout({
      amountBaisa,
      foodBaisa,
      feeBaisa,
      tipBaisa,
      tableCode: bill.code,
      venue: bill.venue,
      table: bill.table,
      description: `Split · ${bill.venue} · Table ${bill.table}`,
      returnUrl,
    });
    return NextResponse.json({
      ...checkout,
      method: body.method ?? "apple",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment gateway error.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
