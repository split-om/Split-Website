import { ReturnClient } from "@/components/pay/ReturnClient";

export default async function PayReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const query = await searchParams;
  const status = String(query.status ?? query.Status ?? query.result ?? "success");
  return <ReturnClient code={code} status={status} />;
}
