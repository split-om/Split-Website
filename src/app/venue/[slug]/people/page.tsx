import { notFound } from "next/navigation";
import { resolveVenue } from "@/lib/store";
import { StaffGate } from "@/components/venue/StaffGate";
import { PeopleAccess } from "@/components/venue/PeopleAccess";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function PeoplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = await resolveVenue(slug);
  if (!venue) notFound();
  return (
    <StaffGate venue={venue} need="people">
      <PeopleAccess venue={venue} />
    </StaffGate>
  );
}
