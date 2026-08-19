import { NextResponse } from "next/server";
import { gatewayStatus } from "@/lib/payments";

export async function GET() {
  return NextResponse.json(gatewayStatus());
}
