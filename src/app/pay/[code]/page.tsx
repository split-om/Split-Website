import type { Metadata } from "next";
import { bills } from "@/lib/bills";
import { PayLoader } from "@/components/pay/PayLoader";
import { resolveBill } from "@/lib/store";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return bills.map((b) => ({ code: b.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const bill = await resolveBill(code);
  return {
    title: bill ? `Table ${bill.table} · ${bill.venue}` : "Your table",
  };
}

export default async function TablePayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const fallback = await resolveBill(code);
  return <PayLoader code={code} fallback={fallback} />;
}
