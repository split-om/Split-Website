import { NextResponse } from "next/server";
import { dinerFromToken, loginDiner, logoutDiner, registerDiner } from "@/lib/store";

export const dynamic = "force-dynamic";

function bearer(request: Request, bodyToken?: string) {
  const header = request.headers.get("authorization") ?? "";
  const fromHeader = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return fromHeader || bodyToken || "";
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || bearer(request);
  const me = await dinerFromToken(token);
  if (!me) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  return NextResponse.json({ me });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    name?: string;
    phone?: string;
    password?: string;
    token?: string;
  };
  if (body.action === "register") {
    const result = await registerDiner(body.name ?? "", body.phone ?? "", body.password ?? "");
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true, ...result });
  }
  if (body.action === "login") {
    const result = await loginDiner(body.phone ?? "", body.password ?? "");
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true, ...result });
  }
  if (body.action === "logout") {
    await logoutDiner(bearer(request, body.token));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Bad request." }, { status: 400 });
}
