import { notFound } from "next/navigation";
import { findVenue, tablePayCode } from "@/lib/venue";
import { getTillSnapshot } from "@/lib/till";
import { getAlerts, getSession } from "@/lib/sync-store";
import { VenueConsole } from "@/components/venue/VenueConsole";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ slug: "qahwa" }];
}

export default async function VenueConsolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = findVenue(slug);
  if (!venue) notFound();
  const snap = getTillSnapshot(slug) ?? { checks: {}, tables: {} };
  const sessions: Record<string, ReturnType<typeof getSession>> = {};
  for (const table of venue.tables) {
    const code = tablePayCode(venue, table);
    sessions[code] = getSession(code);
  }
  return (
    <VenueConsole
      venue={venue}
      initialChecks={snap.checks}
      initialSessions={sessions}
      initialAlerts={getAlerts(venue.name)}
    />
  );
}
