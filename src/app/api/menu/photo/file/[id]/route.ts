import { NextResponse } from "next/server";
import { getMenuPhoto } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await getMenuPhoto(id);
  if (!photo) return NextResponse.json({ error: "No photo." }, { status: 404 });
  return new NextResponse(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
