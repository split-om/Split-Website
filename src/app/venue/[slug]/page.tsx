import { notFound } from "next/navigation";
import { tablePayCode } from "@/lib/venue";
import { getAlerts, getSession, getTillSnapshot, resolveVenue } from "@/lib/store";
import { VenueConsole } from "@/components/venue/VenueConsole";
import { StaffGate } from "@/components/venue/StaffGate";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [{ slug: "qahwa" }];
}

export default async function VenueConsolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await resolveVenue(slug);
  if (!venue) notFound();
  const snap = (await getTillSnapshot(slug)) ?? { checks: {}, tables: {} };
  const sessions: Record<string, Awaited<ReturnType<typeof getSession>>> = {};
  for (const table of venue.tables) {
    const code = tablePayCode(venue, table);
    sessions[code] = await getSession(code);
  }
  return (
    <StaffGate venue={venue} need="floor">
      <VenueConsole
        venue={venue}
        initialChecks={snap.checks}
        initialSessions={sessions}
        initialAlerts={await getAlerts(venue.name)}
      />
    </StaffGate>
  );
}
