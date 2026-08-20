import { NextResponse } from "next/server";
import { listVenues, resolvePayTarget } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    const target = await resolvePayTarget(code);
    if (!target) return NextResponse.json({ error: "Unknown table." }, { status: 404 });
    return NextResponse.json({
      venue: target.venue,
      table: target.table,
    });
  }
  const venues = await listVenues();
  return NextResponse.json({
    venues: venues.map((v) => ({
      slug: v.slug,
      name: v.name,
      area: v.area,
      pos: v.pos,
      tables: v.tables.length,
    })),
  });
}
