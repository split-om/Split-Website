import { notFound } from "next/navigation";
import { findVenue } from "@/lib/venue";
import { QrPrintSheet } from "@/components/venue/QrPrintSheet";

export function generateStaticParams() {
  return [{ slug: "qahwa" }];
}

export default async function QrPrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = findVenue(slug);
  if (!venue) notFound();
  return <QrPrintSheet venue={venue} />;
}
