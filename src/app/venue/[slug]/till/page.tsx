import { notFound } from "next/navigation";
import { findVenue, tablePayCode } from "@/lib/venue";
import { getTillSnapshot } from "@/lib/till";
import { StaffTill } from "@/components/venue/StaffTill";

export const dynamic = "force-dynamic";

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
  const venue = findVenue(slug);
  if (!venue) notFound();
  const demo = query.demo === "ticket" || query.demo === "tables" ? query.demo : undefined;
  const snap = getTillSnapshot(slug) ?? { checks: {}, tables: {} };
  const tableNo = query.table && venue.tables.some((t) => t.number === query.table) ? query.table : "5";
  const seed =
    demo === "ticket"
      ? snap.checks[tablePayCode(venue, venue.tables.find((t) => t.number === tableNo)!)]
      : undefined;
  return (
    <StaffTill
      venue={venue}
      initialDemo={demo}
      initialTable={tableNo}
      initialChecks={snap.checks}
      initialTables={snap.tables}
      initialBill={seed}
    />
  );
}
