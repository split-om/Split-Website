import { NextResponse } from "next/server";
import { findBill } from "@/lib/bills";
import { checkToBill, fetchFoodicsOrder, sandboxCheck } from "@/lib/pos/foodics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || "";
  const bill = findBill(code);
  if (!bill) {
    return NextResponse.json({ error: "Unknown table." }, { status: 404 });
  }

  const live = bill.posOrderId ? await fetchFoodicsOrder(bill.posOrderId) : null;
  const check = live ?? sandboxCheck(code);
  if (!check) {
    return NextResponse.json({ error: "No open check on this table." }, { status: 404 });
  }

  return NextResponse.json({
    check,
    bill: checkToBill(check, bill),
    inventory: "POS owns stock. Split does not deduct inventory.",
  });
}
