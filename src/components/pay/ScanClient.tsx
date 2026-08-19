"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { bills, findBill, normalizeCode } from "@/lib/bills";
import { emptyBill, findPayTarget, findVenue, tablePayCode } from "@/lib/venue";
import { GuestFrame } from "./GuestFrame";
import { QrCard } from "./QrCard";
import { Scanner } from "./Scanner";

export function ScanClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [camera, setCamera] = useState(false);

  const openBill = useCallback(
    (raw: string) => {
      const n = normalizeCode(raw);
      const found = findBill(n);
      if (found) {
        router.push(`/pay/${found.code}`);
        return;
      }
      const target = findPayTarget(n);
      if (target) {
        router.push(`/pay/${tablePayCode(target.venue, target.table)}`);
        return;
      }
      setError("Unknown table. Try QAHWA-4 to order, or QAHWA-7 / PEARL-12 to pay a ready bill.");
    },
    [router],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    openBill(normalizeCode(code));
  }

  return (
    <GuestFrame>
      <div className="flex flex-1 flex-col px-4 pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-split">Scan</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Your table</h1>
        <p className="mt-2 text-sm text-muted">
          Scan the QR on the table. Order food, eat, then pay — same code.
        </p>

        <div className="mt-5">
          {camera ? (
            <Scanner onCode={openBill} />
          ) : (
            <button
              type="button"
              onClick={() => setCamera(true)}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-[1.6rem] bg-ink text-white"
            >
              <span className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-white/40">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <span className="mt-3 text-sm font-semibold">Open camera to scan</span>
              <span className="mt-1 text-xs text-white/60">Works best on a phone</span>
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            placeholder="Table code e.g. PEARL-12"
            className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-split"
            autoCapitalize="characters"
          />
          <button type="submit" className="rounded-2xl bg-split px-4 py-3 text-sm font-bold text-white">
            Open
          </button>
        </form>
        {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}

        <h2 className="mt-8 text-sm font-extrabold">Demo tables</h2>
        <p className="mb-3 text-xs text-muted">Table 4 is empty — order first, then pay. The others already have a bill.</p>
        <div className="space-y-3">
          {(() => {
            const qahwa = findVenue("qahwa");
            const four = qahwa?.tables.find((t) => t.number === "4");
            return qahwa && four ? (
              <QrCard key="qahwa-4" bill={emptyBill(qahwa, four)} onOpen={() => openBill("qahwa-4")} />
            ) : null;
          })()}
          {bills.map((bill) => (
            <QrCard key={bill.code} bill={bill} onOpen={() => openBill(bill.code)} />
          ))}
        </div>
      </div>
    </GuestFrame>
  );
}
