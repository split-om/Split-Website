import type { Metadata } from "next";
import { bills, findBill } from "@/lib/bills";
import { emptyBill, findPayTarget } from "@/lib/venue";
import { PayLoader } from "@/components/pay/PayLoader";

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
  const bill = findBill(code);
  const target = findPayTarget(code);
  const name = bill?.venue ?? target?.venue.name;
  const table = bill?.table ?? target?.table.number;
  return {
    title: name && table ? `Table ${table} · ${name}` : "Your table",
  };
}

export default async function TablePayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const existing = findBill(code);
  const target = findPayTarget(code);
  const fallback = existing ?? (target ? emptyBill(target.venue, target.table) : undefined);
  return <PayLoader code={code} fallback={fallback} />;
}
