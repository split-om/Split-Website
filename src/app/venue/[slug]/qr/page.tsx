import { notFound } from "next/navigation";
import { resolveVenue } from "@/lib/store";
import { QrPrintSheet } from "@/components/venue/QrPrintSheet";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [{ slug: "qahwa" }];
}

export default async function QrPrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await resolveVenue(slug);
  if (!venue) notFound();
  return <QrPrintSheet venue={venue} />;
}
