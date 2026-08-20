import { notFound } from "next/navigation";
import { resolveVenue } from "@/lib/store";
import { StaffGate } from "@/components/venue/StaffGate";
import { MenuEditor } from "@/components/venue/MenuEditor";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = await resolveVenue(slug);
  if (!venue) notFound();
  return (
    <StaffGate venue={venue} need="menu">
      <MenuEditor venue={venue} />
    </StaffGate>
  );
}
