"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { VenueBill } from "@/lib/bills";
import { emptyBill, findPayTarget } from "@/lib/venue";
import { PayApp } from "./PayApp";
import { GuestFrame } from "./GuestFrame";

export function PayLoader({ code, fallback }: { code: string; fallback?: VenueBill }) {
  const target = findPayTarget(code);
  const shell = target ? emptyBill(target.venue, target.table) : undefined;
  const [bill, setBill] = useState<VenueBill | undefined>(fallback ?? shell);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    fetch(`/api/till?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { bill?: VenueBill } | null) => {
        if (d?.bill) setBill(d.bill);
        else if (shell) setBill(shell);
        setTried(true);
      })
      .catch(() => setTried(true));
  }, [code]);

  if (!bill && !tried) {
    return (
      <GuestFrame>
        <p className="px-6 py-16 text-center text-sm text-muted">Opening your table…</p>
      </GuestFrame>
    );
  }

  if (!bill) {
    return (
      <GuestFrame>
        <div className="px-6 py-16 text-center">
          <h1 className="text-2xl font-extrabold">This QR is not a table</h1>
          <p className="mt-2 text-sm text-muted">Ask staff for the tent on your table and scan again.</p>
          <Link href="/pay" className="mt-6 inline-flex rounded-full bg-split px-5 py-3 text-sm font-bold text-white">
            Scan again
          </Link>
        </div>
      </GuestFrame>
    );
  }

  return (
    <PayApp
      key={bill.code}
      bill={bill}
      slug={target?.venue.slug ?? "qahwa"}
    />
  );
}
