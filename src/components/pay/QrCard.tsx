"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { VenueBill } from "@/lib/bills";
import { billTotal } from "@/lib/bills";
import { formatOMRLabel } from "@/lib/money";

export function QrCard({
  bill,
  onOpen,
}: {
  bill: VenueBill;
  onOpen: () => void;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/pay/${bill.code}`;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 220,
      color: { dark: "#111113", light: "#ffffff" },
    }).then(setSrc);
  }, [bill.code]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[1.4rem] bg-white p-4 text-left shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-[92px] w-[92px] shrink-0 place-items-center rounded-2xl border border-line bg-white">
          {src ? <img src={src} alt={`QR for ${bill.venue} table ${bill.table}`} className="h-[84px] w-[84px]" /> : null}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold">{bill.venue}</div>
          <div className="text-xs text-muted">
            Table {bill.table} · {bill.venueArea}
          </div>
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-split">{bill.code.toUpperCase()}</div>
          <div className="mt-1 text-sm font-semibold">
            {bill.items.length ? formatOMRLabel(billTotal(bill)) : "Order then pay"}
          </div>
        </div>
      </div>
    </button>
  );
}
