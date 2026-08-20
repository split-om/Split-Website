import { NextResponse } from "next/server";
import {
  listStaff,
  loginStaff,
  logoutStaff,
  removeStaff,
  staffFromToken,
  upsertStaff,
} from "@/lib/sync-store";
import { toPublic, type StaffAccess } from "@/lib/staff-types";
import { findVenue } from "@/lib/venue";

function bearer(request: Request, bodyToken?: string) {
  const header = request.headers.get("authorization") ?? "";
  const fromHeader = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return fromHeader || bodyToken || "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || bearer(request);
  const me = staffFromToken(token);
  if (!me) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const people = me.access.people ? listStaff(me.slug).map(toPublic) : [toPublic(me)];
  return NextResponse.json({ me: toPublic(me), people });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    slug?: string;
    name?: string;
    password?: string;
    token?: string;
    id?: string;
    access?: StaffAccess;
  };

  if (body.action === "login" && body.slug && body.name && body.password) {
    if (!findVenue(body.slug)) return NextResponse.json({ error: "Unknown café." }, { status: 404 });
    const ok = loginStaff(body.slug, body.name, body.password);
    if (!ok) return NextResponse.json({ error: "Wrong name or password." }, { status: 401 });
    return NextResponse.json({ ok: true, ...ok });
  }

  const me = staffFromToken(bearer(request, body.token));
  if (!me) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  if (body.action === "logout") {
    logoutStaff(bearer(request, body.token));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save" && me.access.people) {
    const result = upsertStaff(me.slug, {
      id: body.id,
      name: body.name ?? "",
      password: body.password,
      access: body.access ?? { floor: true, till: true, menu: false, people: false },
    });
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true, user: toPublic(result) });
  }

  if (body.action === "remove" && body.id && me.access.people) {
    const result = removeStaff(me.slug, body.id);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Not allowed." }, { status: 403 });
}
