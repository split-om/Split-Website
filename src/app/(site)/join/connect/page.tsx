import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectClient } from "@/components/join/ConnectClient";

export const metadata: Metadata = { title: "Connect POS" };

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-muted">Loading…</div>}>
      <ConnectClient />
    </Suspense>
  );
}
