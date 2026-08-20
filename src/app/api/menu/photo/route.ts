import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { staffFromToken } from "@/lib/sync-store";

const MAX = 3 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const me = staffFromToken(token);
  if (!me) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  if (!me.access.menu) return NextResponse.json({ error: "You cannot edit the menu." }, { status: 403 });

  const file = form.get("file");
  if (!(file instanceof File) || file.size < 20) {
    return NextResponse.json({ error: "Pick a photo." }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "Photo is too large (max 3 MB)." }, { status: 400 });
  }
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG, or WebP photo." }, { status: 400 });

  const dir = join(process.cwd(), "public", "uploads", "menu");
  mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  writeFileSync(join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true, url: `/uploads/menu/${name}` });
}
