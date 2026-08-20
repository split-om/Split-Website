import { NextResponse } from "next/server";
import { ensureSchema, useDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!useDb()) {
    return NextResponse.json({ ok: true, db: false });
  }
  try {
    const sql = await ensureSchema();
    if (!sql) return NextResponse.json({ ok: true, db: false });
    await sql`SELECT 1`;
    return NextResponse.json({ ok: true, db: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ ok: false, db: false, error: message }, { status: 500 });
  }
}
