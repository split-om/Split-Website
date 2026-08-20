import { notFound } from "next/navigation";
import { tablePayCode } from "@/lib/venue";
import { getTillSnapshot, resolveVenue } from "@/lib/store";
import { StaffTill } from "@/components/venue/StaffTill";
import { StaffGate } from "@/components/venue/StaffGate";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [{ slug: "qahwa" }];
}

export default async function TillPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ demo?: string; table?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const venue = await resolveVenue(slug);
  if (!venue) notFound();
  const demo = query.demo === "ticket" || query.demo === "tables" ? query.demo : undefined;
  const snap = (await getTillSnapshot(slug)) ?? { checks: {}, tables: {} };
  const tableNo = query.table && venue.tables.some((t) => t.number === query.table) ? query.table : venue.tables[0]?.number ?? "1";
  const seed =
    demo === "ticket"
      ? snap.checks[tablePayCode(venue, venue.tables.find((t) => t.number === tableNo)!)]
      : undefined;
  return (
    <StaffGate venue={venue} need="till">
      <StaffTill
        venue={venue}
        initialDemo={demo}
        initialTable={tableNo}
        initialChecks={snap.checks}
        initialTables={snap.tables}
        initialBill={seed}
        authed
      />
    </StaffGate>
  );
}
