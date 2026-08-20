import { notFound } from "next/navigation";
import { findVenue } from "@/lib/venue";
import { StaffGate } from "@/components/venue/StaffGate";
import { MenuEditor } from "@/components/venue/MenuEditor";

export const dynamic = "force-dynamic";

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = findVenue(slug);
  if (!venue) notFound();
  return (
    <StaffGate venue={venue} need="menu">
      <MenuEditor venue={venue} />
    </StaffGate>
  );
}
