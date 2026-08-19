"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { tablePayCode, type VenueProfile } from "@/lib/venue";

export function QrPrintSheet({ venue }: { venue: VenueProfile }) {
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const base = window.location.origin;
    setOrigin(base);
    Promise.all(
      venue.tables.map(async (table) => {
        const code = tablePayCode(venue, table);
        const url = `${base}/pay/${code}`;
        const src = await QRCode.toDataURL(url, {
          margin: 1,
          width: 360,
          color: { dark: "#111113", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
        return [table.number, src] as const;
      }),
    ).then((pairs) => setCodes(Object.fromEntries(pairs)));
  }, [venue]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="print:hidden mx-auto max-w-4xl px-4 py-8">
        <Link href={`/venue/${venue.slug}`} className="text-sm font-semibold text-split">
          ← Back to {venue.name}
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Table QR tents</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Each QR is only a link to that table — not a price. Print once, stick on the table. When you go live, you
          will use your real domain (for example <span className="font-semibold text-ink">pay.split.om</span>) instead
          of localhost. Same files, same print button.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            Print / save as PDF
          </button>
          <span className="self-center text-xs text-muted">
            {origin ? `Encoding ${origin}/pay/${venue.slug}-…` : ""}
          </span>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 sm:grid-cols-2 print:max-w-none print:grid-cols-2 print:gap-4 print:px-6">
        {venue.tables.map((table) => {
          const code = tablePayCode(venue, table);
          return (
            <article
              key={table.number}
              className="break-inside-avoid rounded-[1.4rem] border-2 border-ink p-6 text-center print:rounded-xl"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-split">Split · Scan to pay</p>
              <h2 className="mt-2 text-4xl font-extrabold">Table {table.number}</h2>
              <p className="text-sm text-muted">{venue.name}</p>
              <div className="mx-auto mt-4 grid h-44 w-44 place-items-center rounded-2xl border border-line bg-white">
                {codes[table.number] ? (
                  <img src={codes[table.number]} alt={`QR table ${table.number}`} className="h-40 w-40" />
                ) : (
                  <span className="text-xs text-muted">Creating…</span>
                )}
              </div>
              <p className="mt-3 text-[11px] font-semibold tracking-wide text-muted">{code.toUpperCase()}</p>
              <p className="mt-1 text-[11px] text-muted">No app · Apple Pay · Google Pay · Card</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
