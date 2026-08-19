import { NextResponse } from "next/server";
import { foodicsStatus } from "@/lib/pos/foodics";

export async function GET() {
  return NextResponse.json(foodicsStatus());
}
