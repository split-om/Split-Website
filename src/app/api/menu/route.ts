import { NextResponse } from "next/server";
import { getVenueMenu, saveVenueMenu, staffFromToken, resolveVenue } from "@/lib/store";
import type { MenuItem } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("venue") ?? "";
  if (!(await resolveVenue(slug))) return NextResponse.json({ error: "Unknown café." }, { status: 404 });
  return NextResponse.json({ items: await getVenueMenu(slug) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; items?: MenuItem[] };
  const header = request.headers.get("authorization") ?? "";
  const token = (header.toLowerCase().startsWith("bearer ") ? header.slice(7) : body.token) ?? "";
  const me = await staffFromToken(token.trim());
  if (!me) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  if (!me.access.menu) return NextResponse.json({ error: "You cannot edit the menu." }, { status: 403 });
  const items: MenuItem[] = (body.items ?? [])
    .filter((i) => i.name?.trim() && i.omr > 0)
    .map((i, n) => {
      const category: MenuItem["category"] =
        i.category === "Food" || i.category === "Sweets" ? i.category : "Drinks";
      return {
        id: i.id?.trim() || `m${n}`,
        name: i.name.trim(),
        detail: i.detail?.trim() || undefined,
        omr: Number(i.omr),
        category,
        photo: i.photo?.trim() || undefined,
      };
    });
  await saveVenueMenu(me.slug, items);
  return NextResponse.json({ ok: true, items });
}
