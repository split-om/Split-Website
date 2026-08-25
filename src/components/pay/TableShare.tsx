"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { VenueBill } from "@/lib/bills";
import { formatOMRLabel } from "@/lib/money";
import { methodLabel } from "@/lib/payments/public";
import type { TableSession } from "@/lib/pay-session";

export function TableShare({
  bill,
  session,
  remaining,
}: {
  bill: VenueBill;
  session: TableSession;
  remaining: number;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/pay/${bill.code}`;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 200,
      color: { dark: "#111113", light: "#ffffff" },
    }).then(setSrc);
  }, [bill.code]);

  return (
    <div className="rounded-[1.4rem] bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-split">Same QR for the whole table</p>
      <p className="mt-1 text-sm text-muted">
        Friends scan this. When someone pays their share, everyone sees it here.
      </p>
      <div className="mt-3 flex items-center gap-3">
        {src ? <img src={src} alt="Table QR" className="h-24 w-24 rounded-xl border border-line" /> : null}
        <div>
          <p className="text-sm font-extrabold">Table {bill.table}</p>
          <p className="text-2xl font-extrabold leading-none">{formatOMRLabel(remaining)}</p>
          <p className="text-[11px] text-muted">still to pay</p>
        </div>
      </div>
      {session.payments.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {session.payments.map((p) => (
            <li key={p.id} className="flex justify-between rounded-xl bg-lilac px-3 py-2">
              <span>
                {p.payerName || methodLabel(p.method)}
                <span className="text-muted"> · {p.splitLabel}</span>
              </span>
              <span className="font-semibold">{formatOMRLabel(p.billBaisa + p.tipBaisa)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted">Nobody has paid yet.</p>
      )}
    </div>
  );
}
