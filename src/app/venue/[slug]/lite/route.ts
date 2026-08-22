import { NextResponse } from "next/server";
import { resolveVenue } from "@/lib/store";
import { venueLiteHtml } from "@/lib/venue-lite-html";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const venue = await resolveVenue(slug);
  if (!venue) {
    return new NextResponse("Unknown café.", { status: 404 });
  }
  return new NextResponse(venueLiteHtml({ slug: venue.slug, name: venue.name, area: venue.area }), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
