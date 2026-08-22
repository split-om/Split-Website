"use client";

import { useState } from "react";
import type { VenueBill } from "@/lib/bills";
import type { TableSession } from "@/lib/pay-session";
import { printTableReceipt } from "@/lib/print-receipt";

export function PrintReceiptButton({
  bill,
  session,
  className,
  dark,
}: {
  bill?: VenueBill;
  session?: TableSession | null;
  className?: string;
  dark?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  if (!bill?.items.length) return null;

  async function print() {
    if (!bill || busy) return;
    setBusy(true);
    setNote("");
    try {
      const result = await printTableReceipt(bill, session);
      setNote(
        result.mode === "sunmi"
          ? "Sent to the Sunmi printer."
          : "Pick InnerPrinter / Sunmi on the print sheet.",
      );
    } catch {
      setNote("Could not print. Open this page on the Sunmi and try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void print()}
        disabled={busy}
        className={
          className ??
          (dark
            ? "w-full rounded-full bg-white/10 py-3 text-sm font-extrabold disabled:opacity-40"
            : "rounded-full bg-sand py-2.5 text-sm font-bold")
        }
      >
        {busy ? "Printing…" : "Print receipt"}
      </button>
      {note ? (
        <p className={`mt-2 text-center text-xs font-semibold ${dark ? "text-emerald-300" : "text-muted"}`}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
