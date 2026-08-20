import { notFound } from "next/navigation";
import { findVenue } from "@/lib/venue";
import { StaffGate } from "@/components/venue/StaffGate";
import { PeopleAccess } from "@/components/venue/PeopleAccess";

export const dynamic = "force-dynamic";

export default async function PeoplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = findVenue(slug);
  if (!venue) notFound();
  return (
    <StaffGate venue={venue} need="people">
      <PeopleAccess venue={venue} />
    </StaffGate>
  );
}
