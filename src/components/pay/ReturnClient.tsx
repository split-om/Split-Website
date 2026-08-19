"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { findBill } from "@/lib/bills";
import { applyPayment, clearPending, loadPending, loadSession } from "@/lib/pay-session";
import { GuestFrame } from "./GuestFrame";

export function ReturnClient({ code, status }: { code: string; status: string }) {
  const bill = findBill(code);
  const [state, setState] = useState<"working" | "paid" | "failed" | "missing">("working");

  useEffect(() => {
    const ok = /success|paid|approved|1/i.test(status) && !/fail|cancel|error/i.test(status);
    const pending = loadPending(code);
    if (!ok) {
      clearPending(code);
      setState("failed");
      return;
    }
    if (!pending || !bill) {
      setState("missing");
      return;
    }
    const session = loadSession(code);
    applyPayment(session, {
      method: pending.method,
      billBaisa: pending.billBaisa,
      foodBaisa: pending.foodBaisa,
      feeBaisa: pending.feeBaisa,
      tipBaisa: pending.tipBaisa,
      splitLabel: pending.splitLabel,
      gatewaySessionId: pending.sessionId,
      provider: "amwal",
    });
    clearPending(code);
    setState("paid");
  }, [bill, code, status]);

  return (
    <GuestFrame venue={bill?.venue} table={bill?.table}>
      <div className="px-6 py-16 text-center">
        {state === "working" ? <p className="text-sm font-semibold text-split">Confirming payment…</p> : null}
        {state === "paid" ? (
          <>
            <div className="pop-in mx-auto grid h-20 w-20 place-items-center rounded-full bg-split text-3xl text-white">✓</div>
            <h1 className="mt-4 text-3xl font-extrabold">Paid</h1>
            <p className="mt-2 text-sm text-muted">Your payment is confirmed.</p>
            <Link href={`/pay/${code}`} className="mt-6 inline-flex rounded-full bg-split px-5 py-3 text-sm font-bold text-white">
              View receipt
            </Link>
          </>
        ) : null}
        {state === "failed" ? (
          <>
            <h1 className="text-2xl font-extrabold">Payment not completed</h1>
            <p className="mt-2 text-sm text-muted">Nothing was taken from the bill. You can try again.</p>
            <Link href={`/pay/${code}`} className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
              Back to the bill
            </Link>
          </>
        ) : null}
        {state === "missing" ? (
          <>
            <h1 className="text-2xl font-extrabold">No pending checkout</h1>
            <Link href={bill ? `/pay/${code}` : "/pay"} className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
              Open table
            </Link>
          </>
        ) : null}
      </div>
    </GuestFrame>
  );
}
