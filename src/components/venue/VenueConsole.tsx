"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { billFoodTotal, itemSubtotal, type VenueBill } from "@/lib/bills";
import { formatOMR, formatOMRLabel } from "@/lib/money";
import { emptySession, remainingBaisa, type TableSession } from "@/lib/pay-session";
import { methodLabel } from "@/lib/payments/public";
import type { StaffAlert } from "@/lib/staff-alerts";
import { billForTable, tablePayCode, type FloorTable, type VenueProfile } from "@/lib/venue";
import { Logo } from "@/components/Logo";
import { useStaff } from "./StaffGate";
import { PrintReceiptButton } from "./PrintReceiptButton";
import { printTableReceipt } from "@/lib/print-receipt";

type TableState = "empty" | "open" | "partial" | "paid";

export function VenueConsole({
  venue,
  initialChecks,
  initialSessions,
  initialAlerts,
}: {
  venue: VenueProfile;
  initialChecks?: Record<string, VenueBill>;
  initialSessions?: Record<string, TableSession>;
  initialAlerts?: StaffAlert[];
}) {
  const [selected, setSelected] = useState(initialAlerts?.find((a) => !a.ack)?.table ?? "7");
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState<"paid" | "waiter" | "order">("paid");
  const [checks, setChecks] = useState<Record<string, VenueBill>>(initialChecks ?? {});
  const [seenPays, setSeenPays] = useState<Record<string, number>>({});
  const [seenAlerts, setSeenAlerts] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [alerts, setAlerts] = useState<StaffAlert[]>(initialAlerts ?? []);
  const [sessions, setSessions] = useState<Record<string, TableSession>>(initialSessions ?? {});
  const { me, signOut } = useStaff();

  useEffect(() => {
    const pull = () => {
      fetch(`/api/sync?venue=${encodeURIComponent(venue.slug)}`)
        .then((r) => r.json())
        .then((d: { sessions?: Record<string, TableSession>; alerts?: StaffAlert[]; checks?: Record<string, VenueBill> }) => {
          if (d.sessions) setSessions(d.sessions);
          if (d.alerts) setAlerts(d.alerts);
          if (d.checks) setChecks(d.checks);
        })
        .catch(() => undefined);
    };
    pull();
    const id = window.setInterval(pull, 1200);
    return () => window.clearInterval(id);
  }, [venue.slug]);

  const snapshots = useMemo(() => {
    return venue.tables.map((table) => {
      const code = tablePayCode(venue, table);
      const session = sessions[code] ?? emptySession(code);
      const live = checks[code];
      const posSettled = !live && session.payments.some((p) => p.method === "pos");
      const bill = posSettled ? undefined : live ?? billForTable(table);
      const state = posSettled ? "paid" : tableState(bill, bill ? session : null);
      return { table, bill, session, state };
    });
  }, [venue, sessions, checks]);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const row of snapshots) next[row.table.number] = row.session?.payments.length ?? 0;
    if (!ready) {
      setSeenPays(next);
      setSeenAlerts(alerts.map((a) => a.id));
      setReady(true);
      return;
    }
    for (const row of snapshots) {
      const count = row.session?.payments.length ?? 0;
      const prev = seenPays[row.table.number] ?? 0;
      if (count > prev) {
        const last = row.session?.payments[count - 1];
        if (last) {
          setToastKind("paid");
          setToast(
            `Table ${row.table.number} · ${methodLabel(last.method)} · ${formatOMRLabel(last.billBaisa + last.tipBaisa)}`,
          );
          window.setTimeout(() => setToast(""), 4000);
        }
      }
    }
    setSeenPays(next);
    const fresh = alerts.filter((a) => !a.ack && !seenAlerts.includes(a.id));
    if (fresh[0]) {
      setSelected(fresh[0].table);
      setToastKind(fresh[0].type === "order" ? "order" : fresh[0].type === "waiter" ? "waiter" : "paid");
      setToast(fresh[0].message);
      window.setTimeout(() => setToast(""), 6000);
    }
    if (fresh.length) setSeenAlerts((ids) => [...ids, ...fresh.map((a) => a.id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, alerts]);

  const current = snapshots.find((s) => s.table.number === selected) ?? snapshots[0];
  const openCount = snapshots.filter((s) => s.state === "open" || s.state === "partial").length;
  const paidToday = snapshots.reduce(
    (sum, s) => sum + (s.session?.payments.reduce((a, p) => a + p.billBaisa + p.tipBaisa, 0) ?? 0),
    0,
  );
  const tipsToday = snapshots.reduce(
    (sum, s) => sum + (s.session?.payments.reduce((a, p) => a + p.tipBaisa, 0) ?? 0),
    0,
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1200px] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="text-sm font-extrabold">{venue.name}</div>
            <div className="text-[11px] text-muted">Staff · {me.name} · {venue.pos}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Stat label="Open tables" value={String(openCount)} />
          <Stat label="Taken today" value={formatOMR(paidToday)} />
          <Stat label="Tips" value={formatOMR(tipsToday)} />
          {me.access.till ? (
            <Link
              href={`/venue/${venue.slug}/till`}
              className="rounded-full bg-violet-600 px-3 py-2 font-bold text-white"
            >
              Open till
            </Link>
          ) : null}
          {me.access.menu ? (
            <Link href={`/venue/${venue.slug}/menu`} className="rounded-full bg-white px-3 py-2 font-bold">
              Edit menu
            </Link>
          ) : null}
          {me.access.people ? (
            <Link href={`/venue/${venue.slug}/people`} className="rounded-full bg-white px-3 py-2 font-bold">
              People
            </Link>
          ) : null}
          <Link
            href={`/venue/${venue.slug}/qr`}
            className="rounded-full bg-ink px-3 py-2 font-bold text-white"
          >
            Print table QRs
          </Link>
          <button type="button" onClick={signOut} className="rounded-full px-3 py-2 font-bold text-muted">
            Sign out
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
        <div>
          <HowItWorks />
          {alerts.some((a) => !a.ack) ? (
            <div className="mb-4 space-y-2">
              {alerts
                .filter((a) => !a.ack)
                .slice(0, 4)
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-amber-100 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-extrabold">
                        {a.type === "order" ? "New order" : a.type === "waiter" ? "Waiter called" : "Pay at table"} · Table {a.table}
                      </p>
                      <p className="text-xs text-muted">{a.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        fetch("/api/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "ack", id: a.id }),
                        }).catch(() => undefined);
                        setSelected(a.table);
                        setAlerts((list) => list.map((x) => (x.id === a.id ? { ...x, ack: true } : x)));
                      }}
                      className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
                    >
                      On my way
                    </button>
                  </div>
                ))}
            </div>
          ) : null}

          <h2 className="mt-5 text-sm font-extrabold uppercase tracking-wider text-muted">Floor</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {snapshots.map((row) => (
              <button
                key={row.table.number}
                type="button"
                onClick={() => setSelected(row.table.number)}
                className={`rounded-3xl border p-4 text-left ${
                  selected === row.table.number ? "border-split ring-2 ring-split/20" : "border-line bg-white"
                } ${
                  alerts.some((a) => a.table === row.table.number && !a.ack)
                    ? "animate-pulse bg-amber-100 border-amber-400"
                    : tone(row.state)
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider">
                  {alerts.some((a) => a.table === row.table.number && !a.ack && a.type === "order")
                    ? "order"
                    : alerts.some((a) => a.table === row.table.number && !a.ack && a.type === "waiter")
                      ? "waiter"
                      : row.state}
                </div>
                <div className="text-2xl font-extrabold">{row.table.number}</div>
                <div className="text-[11px] text-muted">{row.table.seats} seats</div>
                {row.bill && row.session ? (
                  <div className="mt-2 text-xs font-semibold">
                    {row.state === "paid" ? "Settled" : formatOMRLabel(remainingBaisa(row.bill, row.session))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-muted">Free</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.6rem] border border-line bg-white p-5">
          {current ? (
            <TablePanel
              venue={venue}
              row={current}
              calls={alerts.filter((a) => a.table === current.table.number && !a.ack)}
              onAck={(id) => {
                fetch("/api/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "ack", id }),
                }).catch(() => undefined);
                setAlerts((list) => list.map((x) => (x.id === id ? { ...x, ack: true } : x)));
              }}
              onReset={(code) => {
                fetch("/api/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "reset", code }),
                })
                  .then((r) => r.json())
                  .then((d: { session?: TableSession }) => {
                    if (d.session) setSessions((s) => ({ ...s, [code]: d.session! }));
                  })
                  .catch(() => undefined);
              }}
              onPosSettled={(code, session, tableNo, amountBaisa) => {
                setChecks((cur) => {
                  const next = { ...cur };
                  delete next[code];
                  return next;
                });
                setSessions((s) => ({ ...s, [code]: session }));
                setToastKind("paid");
                setToast(`Table ${tableNo} · Bank POS · ${formatOMRLabel(amountBaisa)}`);
                window.setTimeout(() => setToast(""), 5000);
              }}
            />
          ) : null}
        </aside>
      </div>

      {toast ? (
        <div
          className={`fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-xl ${
            toastKind === "order" ? "bg-violet-600" : toastKind === "waiter" ? "bg-amber-600" : "bg-ink"
          }`}
        >
          {toastKind === "order" ? "Order · " : toastKind === "waiter" ? "Waiter · " : "Paid · "}
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function TablePanel({
  venue,
  row,
  calls,
  onAck,
  onReset,
  onPosSettled,
}: {
  venue: VenueProfile;
  row: { table: FloorTable; bill?: VenueBill; session: TableSession | null; state: TableState };
  calls: StaffAlert[];
  onAck: (id: string) => void;
  onReset: (code: string) => void;
  onPosSettled: (code: string, session: TableSession, table: string, amountBaisa: number) => void;
}) {
  const { table, bill, session, state } = row;
  const [qr, setQr] = useState("");
  const [posAsk, setPosAsk] = useState(false);
  const [posBusy, setPosBusy] = useState(false);
  const [posNote, setPosNote] = useState("");

  const payCode = bill?.code ?? tablePayCode(venue, table);

  useEffect(() => {
    if (typeof window === "undefined") return;
    QRCode.toDataURL(`${window.location.origin}/pay/${payCode}`, {
      margin: 1,
      width: 180,
      color: { dark: "#111113", light: "#ffffff" },
    }).then(setQr);
  }, [payCode]);

  async function takeOnPos() {
    setPosBusy(true);
    const res = await fetch("/api/till", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pos", slug: venue.slug, table: table.number }),
    });
    const data = (await res.json()) as {
      error?: string;
      session?: TableSession;
      amountBaisa?: number;
      code?: string;
    };
    setPosBusy(false);
    if (!res.ok || !data.session || data.amountBaisa == null || !data.code) {
      setPosNote(data.error || "Could not mark as paid.");
      setPosAsk(false);
      return;
    }
    setPosAsk(false);
    setPosNote(`Paid on bank POS. Table ${table.number} is cleared.`);
    if (bill) printTableReceipt(bill, data.session).catch(() => undefined);
    onPosSettled(data.code, data.session, table.number, data.amountBaisa);
  }

  if (state === "paid" && (!bill || !bill.items.length)) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-split">Table {table.number}</p>
        <h3 className="text-2xl font-extrabold">Paid on bank POS</h3>
        <p className="mt-2 text-sm text-muted">
          The rest was taken on the bank card machine. This table is free for the next guests.
        </p>
        {posNote ? <p className="mt-3 text-sm font-semibold text-emerald-700">{posNote}</p> : null}
        <button
          type="button"
          onClick={() => onReset(payCode)}
          className="mt-4 text-xs font-semibold text-muted"
        >
          Ready for next guests
        </button>
      </div>
    );
  }

  if (!bill || !session) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Table {table.number}</p>
        <h3 className="text-2xl font-extrabold">Empty</h3>
        <p className="mt-2 text-sm text-muted">
          Guest scans the table QR, picks food, then pays after they eat. The check appears here when they send an
          order.
        </p>
        {qr ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sand p-3">
            <img src={qr} alt="" className="h-20 w-20 rounded-lg bg-white" />
            <div className="text-xs">
              <p className="font-bold">Table tent QR</p>
              <p className="text-muted">/pay/{payCode}</p>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const remaining = remainingBaisa(bill, session);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-split">
        Table {table.number} · {venue.pos}
      </p>
      <h3 className="text-2xl font-extrabold">{state === "paid" ? "Paid" : "Open check"}</h3>
      <p className="text-sm text-muted">Server {bill.server}</p>
      {calls.length > 0 ? (
        <div className="mt-3 rounded-2xl bg-amber-100 p-3">
          <p className="text-sm font-extrabold">Guest needs you</p>
          {calls.map((c) => (
            <div key={c.id} className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span>
                {c.type === "order"
                  ? c.message
                  : c.type === "waiter"
                    ? "Called the waiter"
                    : "Wants to pay at the table"}
              </span>
              <button
                type="button"
                onClick={() => onAck(c.id)}
                className="rounded-full bg-ink px-2 py-1 font-bold text-white"
              >
                On my way
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <ul className="mt-4 space-y-1 text-sm">
        {bill.items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.qty}× {item.name}
            </span>
            <span className="font-semibold">{formatOMR(itemSubtotal(item))}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-line pt-3 text-sm">
        <div className="flex justify-between text-muted">
          <span>Food + VAT</span>
          <span>{formatOMRLabel(billFoodTotal(bill))}</span>
        </div>
        <div className="flex justify-between font-extrabold">
          <span>Remaining</span>
          <span>{formatOMRLabel(remaining)}</span>
        </div>
      </div>

      {session.payments.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Guest payments</p>
          <ul className="mt-2 space-y-2 text-sm">
            {session.payments.map((p) => (
              <li key={p.id} className="rounded-xl bg-lilac px-3 py-2">
                {methodLabel(p.method)} · {formatOMRLabel(p.billBaisa + p.tipBaisa)}
                {p.tipBaisa > 0 ? ` · tip ${formatOMR(p.tipBaisa)}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Waiting for a guest to scan the table QR.</p>
      )}

      {qr ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sand p-3">
          <img src={qr} alt="" className="h-20 w-20 rounded-lg bg-white" />
          <div className="text-xs">
            <p className="font-bold">Table tent QR</p>
            <p className="text-muted">Guest scans this. Or take the rest on the bank POS.</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <PrintReceiptButton bill={bill} session={session} />
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => {
              setPosNote("");
              setPosAsk(true);
            }}
            className="rounded-full bg-ink py-2.5 text-sm font-bold text-white"
          >
            Pay the rest on bank POS
          </button>
        ) : null}
        <Link
          href={`/pay/${bill.code}`}
          target="_blank"
          className="rounded-full bg-split py-2.5 text-center text-sm font-bold text-white"
        >
          Open guest phone (new tab)
        </Link>
        <button
          type="button"
          onClick={() => {
            onReset(bill.code);
          }}
          className="text-xs font-semibold text-muted"
        >
          Reset this table (demo)
        </button>
        {posNote ? <p className="text-center text-sm font-semibold text-emerald-700">{posNote}</p> : null}
      </div>

      {posAsk ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-[1.6rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-split">Bank POS</p>
            <h4 className="mt-1 text-xl font-extrabold">Take the rest on the card machine?</h4>
            <p className="mt-2 text-sm text-muted">
              Table {table.number} still owes <strong>{formatOMRLabel(remaining)}</strong>. Put this amount on the
              bank POS. Tap confirm only after the machine says approved. That clears this bill and marks it paid.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={posBusy}
                onClick={() => setPosAsk(false)}
                className="flex-1 rounded-full bg-sand py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={posBusy}
                onClick={() => void takeOnPos()}
                className="flex-1 rounded-full bg-ink py-2.5 text-sm font-bold text-white"
              >
                {posBusy ? "Saving…" : "Confirm — taken on POS"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="rounded-[1.4rem] bg-white p-4 text-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-split">What you see vs the guest</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-4">
        {[
          ["1. Guest orders on the phone", "Scan table QR → pick food. Or you ring it on the till."],
          ["2. This tablet gets the ticket", "New order flashes. Kitchen / barista makes it."],
          ["3. They eat, then pay", "Same QR → split / tip → Apple Pay or pay you."],
          ["4. This screen flashes Paid", `Guest pays on the phone, or you take the rest on the bank POS.`],
        ].map(([t, d]) => (
          <li key={t} className="rounded-2xl bg-sand p-3">
            <div className="font-extrabold">{t}</div>
            <div className="mt-1 text-xs text-muted">{d}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-extrabold">{value}</div>
    </div>
  );
}

function tableState(bill?: VenueBill, session?: TableSession | null): TableState {
  if (!bill || !session) return "empty";
  const rem = remainingBaisa(bill, session);
  if (rem <= 0 && session.payments.length > 0) return "paid";
  if (session.paidBaisa > 0) return "partial";
  return "open";
}

function tone(state: TableState) {
  if (state === "paid") return "bg-emerald-50";
  if (state === "partial") return "bg-amber-50";
  if (state === "open") return "bg-white";
  return "bg-[#fafafa]";
}


