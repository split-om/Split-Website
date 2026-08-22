"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useStaff } from "./StaffGate";
import { PrintReceiptButton } from "./PrintReceiptButton";
import type { StoredReceipt } from "@/lib/guests";
import { formatOMRLabel } from "@/lib/money";
import { billTotal } from "@/lib/bills";
import type { VenueProfile } from "@/lib/venue";

export function ReceiptsClient({ venue }: { venue: VenueProfile }) {
  const { me, signOut } = useStaff();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/receipts?venue=${encodeURIComponent(venue.slug)}`)
      .then((r) => r.json())
      .then((d: { receipts?: StoredReceipt[] }) => setReceipts(d.receipts ?? []))
      .catch(() => undefined);
  }, [venue.slug]);

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <div className="flex gap-2 text-xs font-bold">
          <Link href={`/venue/${venue.slug}`} className="rounded-full bg-white px-3 py-2">
            Floor
          </Link>
          <button type="button" onClick={signOut} className="rounded-full px-3 py-2 text-muted">
            Sign out
          </button>
        </div>
      </header>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-split">{venue.name}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Previous receipts</h1>
      <p className="mt-2 text-sm text-muted">
        Closed tables are saved here. Guest names show when they have a Split account.
      </p>
      <p className="mt-2 text-xs text-muted">Signed in as {me.name}</p>

      {receipts.length === 0 ? (
        <p className="mt-10 rounded-[1.4rem] bg-white p-6 text-sm text-muted">
          No closed receipts yet. Pay a table or take the rest on bank POS, then it appears here.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {receipts.map((r) => {
            const total = billTotal(r.bill);
            const shown = open === r.id;
            return (
              <li key={r.id} className="rounded-[1.4rem] border border-line bg-white p-4">
                <button
                  type="button"
                  onClick={() => setOpen(shown ? null : r.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-sm font-extrabold">
                      Table {r.table}
                      {r.guestName ? ` · ${r.guestName}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(r.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold">{formatOMRLabel(total)}</span>
                </button>
                {shown ? (
                  <div className="mt-3 border-t border-line pt-3">
                    {r.guestName ? (
                      <p className="mb-2 text-sm font-semibold">
                        Guest {r.guestName}
                        {r.guestPhone ? ` · ${r.guestPhone}` : ""}
                      </p>
                    ) : (
                      <p className="mb-2 text-xs text-muted">Walk-in · no guest account</p>
                    )}
                    <ul className="space-y-1 text-sm">
                      {r.bill.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {item.qty}× {item.name}
                          </span>
                          <span>{formatOMRLabel(item.unitBaisa * item.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <PrintReceiptButton bill={r.bill} session={r.session} />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
