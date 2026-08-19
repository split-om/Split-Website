import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessClient } from "@/components/join/SuccessClient";

export const metadata: Metadata = { title: "Application received" };

export default function JoinSuccessPage() {
  return (
    <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-muted">Loading application…</div>}>
      <SuccessClient />
    </Suspense>
  );
}
