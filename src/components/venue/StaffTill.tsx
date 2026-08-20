"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { tablePayCode, type VenueProfile } from "@/lib/venue";
import type { VenueBill } from "@/lib/bills";
import { formatOMR, formatOMRLabel, omrToBaisa } from "@/lib/money";
import type { MenuItem } from "@/lib/menu";
import { SplitMark } from "@/components/Logo";


const PIN = "1234";

type Line = { name: string; qty: number; omr: number };
type TableMeta = {
  table: string;
  hasCheck: boolean;
  paidBaisa: number;
  remaining: number;
  food: number;
};
type Floor = "lock" | "tables" | "ticket";

function tableStatus(meta?: TableMeta): "empty" | "open" | "paid" {
  if (!meta?.hasCheck) return "empty";
  if (meta.hasCheck && meta.paidBaisa > 0 && meta.remaining <= 0) return "paid";
  return "open";
}

function linesFromBill(bill?: VenueBill): Line[] {
  if (!bill) return [];
  return bill.items.map((i) => ({
    name: i.name,
    qty: i.qty,
    omr: i.unitBaisa / 1000,
  }));
}

export function StaffTill({
  venue,
  initialDemo,
  initialTable,
  initialChecks,
  initialTables,
  initialBill,
  authed,
}: {
  venue: VenueProfile;
  initialDemo?: "tables" | "ticket";
  initialTable?: string;
  initialChecks?: Record<string, VenueBill>;
  initialTables?: Record<string, TableMeta>;
  initialBill?: VenueBill;
  authed?: boolean;
}) {
  const [floor, setFloor] = useState<Floor>(initialDemo ?? (authed ? "tables" : "lock"));
  const [menu, setMenu] = useState<Array<{ name: string; omr: number }>>([]);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [table, setTable] = useState<string | null>(
    initialDemo === "ticket" ? initialTable || "5" : null,
  );
  const [lines, setLines] = useState<Line[]>(() => linesFromBill(initialBill));
  const [digits, setDigits] = useState("");
  const [mode, setMode] = useState<"menu" | "total">("menu");
  const [checks, setChecks] = useState<Record<string, VenueBill>>(initialChecks ?? {});
  const [tables, setTables] = useState<Record<string, TableMeta>>(initialTables ?? {});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState("");
  const [showInstall, setShowInstall] = useState(false);

  function refresh() {
    fetch(`/api/till?venue=${encodeURIComponent(venue.slug)}`)
      .then((r) => r.json())
      .then((d: { checks?: Record<string, VenueBill>; tables?: Record<string, TableMeta> }) => {
        setChecks(d.checks ?? {});
        setTables(d.tables ?? {});
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    fetch(`/api/menu?venue=${encodeURIComponent(venue.slug)}`)
      .then((r) => r.json())
      .then((d: { items?: MenuItem[] }) =>
        setMenu((d.items ?? []).map((m) => ({ name: m.name, omr: m.omr }))),
      )
      .catch(() => undefined);
  }, [venue.slug]);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
      );
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (initialDemo) {
      sessionStorage.setItem("split-till-shift", venue.slug);
    } else if (sessionStorage.getItem("split-till-shift") === venue.slug) {
      setFloor("tables");
    }
    if (!initialDemo && !localStorage.getItem("split-till-pinned")) setShowInstall(true);
  }, [venue.slug, initialDemo]);

  useEffect(() => {
    if (floor === "lock") return;
    refresh();
    const id = window.setInterval(refresh, 2000);
    return () => window.clearInterval(id);
  }, [floor, venue.slug]);

  useEffect(() => {
    if (floor !== "ticket" || !table || lines.length) return;
    const row = venue.tables.find((t) => t.number === table);
    if (!row) return;
    const bill = checks[tablePayCode(venue, row)];
    if (!bill) return;
    setLines(
      bill.items.map((i) => ({
        name: i.name,
        qty: i.qty,
        omr: i.unitBaisa / 1000,
      })),
    );
  }, [floor, table, checks, lines.length, venue]);

  function pressPin(d: string) {
    setPinError(false);
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      if (next === PIN) {
        sessionStorage.setItem("split-till-shift", venue.slug);
        setFloor("tables");
        setPin("");
      } else {
        setPinError(true);
        setPin("");
      }
    }
  }

  function openTable(number: string) {
    setTable(number);
    setMsg("");
    setDigits("");
    setMode("menu");
    const code = tablePayCode(venue, venue.tables.find((t) => t.number === number)!);
    const bill = checks[code];
    setLines(
      bill
        ? bill.items.map((i) => ({
            name: i.name,
            qty: i.qty,
            omr: i.unitBaisa / 1000,
          }))
        : [],
    );
    setFloor("ticket");
  }

  function add(name: string, omr: number) {
    setDigits("");
    setLines((cur) => {
      const hit = cur.find((l) => l.name === name && l.omr === omr);
      if (hit) return cur.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l));
      return [...cur, { name, qty: 1, omr }];
    });
  }

  function bump(i: number, delta: number) {
    setLines((cur) =>
      cur
        .map((l, j) => (j === i ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  const typedBaisa = digits ? omrToBaisa(Number(digits) || 0) : 0;
  const foodBaisa = useMemo(() => {
    if (typedBaisa > 0 && lines.length === 0) return typedBaisa;
    return lines.reduce((s, l) => s + omrToBaisa(l.omr) * l.qty, 0);
  }, [lines, typedBaisa]);

  async function sendCheck() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/till", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        slug: venue.slug,
        table,
        items: lines,
        totalOmr: lines.length ? undefined : Number(digits) || undefined,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not save");
      return;
    }
    setMsg("Ready — guest scans the table QR");
    refresh();
  }

  async function clear() {
    if (!table) return;
    await fetch("/api/till", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear", slug: venue.slug, table }),
    });
    setLines([]);
    setDigits("");
    setMsg("Check cleared");
    refresh();
  }

  function endShift() {
    sessionStorage.removeItem("split-till-shift");
    setFloor("lock");
    setTable(null);
    setPin("");
  }

  if (floor === "lock") {
    return (
      <div className="flex min-h-dvh flex-col bg-[#0c0b10] px-6 py-8 text-white lg:flex-row lg:items-center lg:justify-center lg:gap-20">
        <div className="mx-auto max-w-md text-center lg:mx-0 lg:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-violet-300">Staff tablet</p>
          <div className="mt-5 flex items-center justify-center gap-3 lg:justify-start">
            <Mark />
            <h1 className="text-4xl font-extrabold tracking-tight">{venue.name}</h1>
          </div>
          <p className="mt-3 text-white/50">
            This stays on the counter all day. Guests never see it — they only scan the paper QR on the table.
          </p>
          <ol className="mt-8 space-y-3 text-left text-sm text-white/70">
            <li className="rounded-2xl bg-white/5 px-4 py-3">
              <span className="font-extrabold text-white">1. First morning only</span>
              <p className="mt-1 text-white/45">
                Chrome → the three-dot menu → <strong className="text-white/80">Add to Home screen</strong>. An icon
                named Split Till appears. No Play Store.
              </p>
            </li>
            <li className="rounded-2xl bg-white/5 px-4 py-3">
              <span className="font-extrabold text-white">2. Every shift</span>
              <p className="mt-1 text-white/45">Tap the icon → enter PIN → pick a table → send the bill.</p>
            </li>
          </ol>
        </div>

        <div className="mx-auto mt-10 w-full max-w-xs lg:mt-0">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-white/35">Shift PIN</p>
          <div className="mt-3 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full ${
                  pin.length > i ? "bg-violet-400" : "bg-white/15"
                } ${pinError ? "bg-red-400" : ""}`}
              />
            ))}
          </div>
          {pinError ? (
            <p className="mt-2 text-center text-xs font-semibold text-red-300">Wrong PIN</p>
          ) : (
            <p className="mt-2 text-center text-xs text-white/30">Demo PIN is 1234</p>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map((k) =>
              k === "" ? (
                <span key="pad-empty" />
              ) : (
                <button
                  key={k}
                  type="button"
                  onClick={() => (k === "←" ? setPin((p) => p.slice(0, -1)) : pressPin(k))}
                  className="h-16 rounded-2xl bg-white/8 text-2xl font-extrabold active:bg-white/16"
                >
                  {k}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  if (floor === "tables" || !table) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#0c0b10] text-white">
        <TillBar venue={venue} clock={clock} onEnd={endShift} />
        {showInstall ? (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-600 px-4 py-3 text-sm">
            <p>
              <strong>Pin this like an app.</strong> Chrome → three-dot menu → Add to Home screen. Next shift they just
              tap Split Till.
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("split-till-pinned", "1");
                setShowInstall(false);
              }}
              className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-violet-800"
            >
              Got it
            </button>
          </div>
        ) : null}
        <div className="flex-1 px-4 py-5">
          <p className="text-sm text-white/45">Tap the table you’re serving.</p>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {venue.tables.map((t) => {
              const code = tablePayCode(venue, t);
              const status = tableStatus(tables[code]);
              return (
                <button
                  key={t.number}
                  type="button"
                  onClick={() => openTable(t.number)}
                  className={`aspect-square rounded-[1.6rem] p-3 text-left transition active:scale-[0.98] ${
                    status === "open"
                      ? "bg-violet-600"
                      : status === "paid"
                        ? "bg-emerald-600"
                        : "bg-white/8"
                  }`}
                >
                  <span className="block text-3xl font-extrabold leading-none">{t.number}</span>
                  <span className="mt-2 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                    {status === "open" ? "Open" : status === "paid" ? "Paid" : `${t.seats} seats`}
                  </span>
                  {status !== "empty" && tables[code]?.food ? (
                    <span className="mt-1 block text-xs text-white/80">{formatOMR(tables[code].food)}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/40">
            <Legend swatch="bg-white/20" label="Empty" />
            <Legend swatch="bg-violet-600" label="Bill sent — waiting for guest" />
            <Legend swatch="bg-emerald-600" label="Paid on the phone" />
          </div>
        </div>
        <footer className="flex items-center justify-between px-4 py-3 text-xs text-white/30">
          <span>No till hardware. Paper QR stays on the table.</span>
          <Link href={`/venue/${venue.slug}`} className="font-semibold text-violet-300">
            Floor alerts →
          </Link>
        </footer>
      </div>
    );
  }

  const code = tablePayCode(venue, venue.tables.find((t) => t.number === table)!);
  const meta = tables[code];
  const status = tableStatus(meta);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0c0b10] text-white">
      <TillBar venue={venue} clock={clock} onEnd={endShift} />
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={() => setFloor("tables")} className="text-sm font-semibold text-violet-300">
          ← Tables
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold leading-none">Table {table}</h1>
          <p className="text-[11px] text-white/40">Guest QR · /pay/{code}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${
            status === "paid"
              ? "bg-emerald-500/20 text-emerald-300"
              : status === "open"
                ? "bg-violet-500/20 text-violet-200"
                : "bg-white/10 text-white/50"
          }`}
        >
          {status === "paid" ? "Paid" : status === "open" ? "Open" : "Empty"}
        </span>
      </div>

      <div className="grid flex-1 gap-4 px-4 pb-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("menu")}
              className={`rounded-full py-2 text-sm font-extrabold ${mode === "menu" ? "bg-white text-ink" : "bg-white/8"}`}
            >
              Tap items
            </button>
            <button
              type="button"
              onClick={() => setMode("total")}
              className={`rounded-full py-2 text-sm font-extrabold ${mode === "total" ? "bg-white text-ink" : "bg-white/8"}`}
            >
              Type total
            </button>
          </div>

          {mode === "menu" ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {menu.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => add(m.name, m.omr)}
                  className="rounded-2xl bg-white/8 px-3 py-4 text-left active:bg-white/14"
                >
                  <span className="block text-sm font-extrabold">{m.name}</span>
                  <span className="mt-1 block text-xs text-white/45">{m.omr.toFixed(3)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-center text-xs text-white/40">From the paper bill — food + VAT, no fee</p>
              <p className="mt-2 text-center text-5xl font-extrabold tabular-nums">
                {digits || "0.000"}
              </p>
              <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() =>
                      setDigits((cur) => {
                        if (k === "←") return cur.slice(0, -1);
                        if (k === "." && cur.includes(".")) return cur;
                        return (cur + k).slice(0, 8);
                      })
                    }
                    className="h-14 rounded-2xl bg-white/8 text-xl font-extrabold active:bg-white/16"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="flex flex-col rounded-[1.6rem] bg-white/6 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/35">Check</p>
          <ul className="mt-3 flex-1 space-y-2">
            {lines.length === 0 && !digits ? (
              <li className="py-8 text-center text-sm text-white/35">Tap items or type the total.</li>
            ) : null}
            {lines.map((l, i) => (
              <li key={`${l.name}-${i}`} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => bump(i, -1)}
                    className="h-8 w-8 rounded-full bg-white/10 text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-extrabold">{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => bump(i, 1)}
                    className="h-8 w-8 rounded-full bg-white/10 text-lg font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm">{l.name}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatOMR(omrToBaisa(l.omr) * l.qty)}</span>
              </li>
            ))}
            {lines.length === 0 && digits ? (
              <li className="flex justify-between text-sm">
                <span>Table total</span>
                <span className="font-semibold tabular-nums">{formatOMR(typedBaisa)}</span>
              </li>
            ) : null}
          </ul>
          <div className="mt-4 border-t border-white/10 pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Food + VAT</span>
              <span className="font-extrabold tabular-nums">{formatOMRLabel(foodBaisa)}</span>
            </div>
            <div className="mt-1 flex justify-between text-white/45">
              <span>Guest fee (they pay)</span>
              <span>0.203</span>
            </div>
          </div>
          <button
            type="button"
            onClick={sendCheck}
            disabled={busy || foodBaisa <= 0}
            className="mt-4 w-full rounded-full bg-violet-500 py-4 text-lg font-extrabold disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send to guest QR"}
          </button>
          <button type="button" onClick={clear} className="mt-2 w-full py-2 text-xs font-semibold text-white/35">
            Clear check
          </button>
          {msg ? <p className="mt-2 text-center text-sm font-semibold text-emerald-300">{msg}</p> : null}
        </aside>
      </div>
    </div>
  );
}

function TillBar({ venue, clock, onEnd }: { venue: VenueProfile; clock: string; onEnd: () => void }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
      <div className="flex items-center gap-2">
        <Mark />
        <div>
          <p className="text-sm font-extrabold leading-none">{venue.name}</p>
          <p className="mt-1 text-[11px] text-white/40">{venue.server} on shift · no POS hookup</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-semibold tabular-nums text-white/50 sm:block">{clock}</span>
        <button type="button" onClick={onEnd} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold">
          End shift
        </button>
      </div>
    </header>
  );
}

function Mark() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600" aria-hidden>
      <SplitMark fill="#ffffff" className="h-6 w-6" />
    </span>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
