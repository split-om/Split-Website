"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatOMR, formatOMRLabel } from "@/lib/money";
import { methodLabel } from "@/lib/payments/public";
import type { JoinApplication } from "@/lib/join";
import type { HqPayment } from "@/lib/pay-session";
import { Logo } from "@/components/Logo";

type Snapshot = {
  payments: HqPayment[];
  applications: JoinApplication[];
  totals: {
    fee: number;
    tips: number;
    gmv: number;
    count: number;
    todayFee: number;
    todayCount: number;
    todayGmv: number;
  };
  venues: Array<{ venue: string; pays: number; fee: number; gmv: number; last?: string }>;
};

export function HqDashboard() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const pull = () => {
      fetch("/api/hq")
        .then((r) => r.json())
        .then((d: Snapshot) => setData(d))
        .catch(() => undefined);
    };
    pull();
    const id = window.setInterval(pull, 2000);
    return () => window.clearInterval(id);
  }, []);

  const t = data?.totals;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Logo invert />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">HQ</h1>
          <p className="text-sm text-white/55">Your clients. Your fee. Not the restaurant’s till.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/hq/pos" className="rounded-full bg-violet-500 px-4 py-2 font-semibold text-white">
            POS lab
          </Link>
          <Link href="/venue" className="rounded-full border border-white/20 px-4 py-2 font-semibold">
            Café consoles
          </Link>
          <Link href="/join/applications" className="rounded-full border border-white/20 px-4 py-2 font-semibold">
            Applications
          </Link>
        </div>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Split fee today" value={formatOMRLabel(t?.todayFee ?? 0)} hint={`${t?.todayCount ?? 0} payments`} accent />
        <Card label="Split fee all time" value={formatOMRLabel(t?.fee ?? 0)} hint="~98% gross after Amwal’s cut of the fee" />
        <Card label="Guest spend (GMV)" value={formatOMRLabel(t?.todayGmv ?? 0)} hint="Money through Amwal to restaurants — not yours" />
        <Card label="Tips to staff" value={formatOMRLabel(t?.tips ?? 0)} hint="Goes to the venue team" />
      </div>

      <p className="mt-3 text-xs text-white/40">
        Your money is <strong className="text-white/70">Split’s fee</strong> only. GMV and tips belong to the café. Amwal
        settles the bill to them; you keep OMR 0.200 after Amwal’s 1.5% (guest sees 0.203).
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Clients</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Payments</th>
                <th className="px-4 py-3">Your fee</th>
                <th className="px-4 py-3">Their GMV</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {(data?.venues.length ? data.venues : []).map((v) => (
                <tr key={v.venue} className="border-t border-white/10">
                  <td className="px-4 py-3 font-semibold">{v.venue}</td>
                  <td className="px-4 py-3">{v.pays}</td>
                  <td className="px-4 py-3 text-violet-300">{formatOMRLabel(v.fee)}</td>
                  <td className="px-4 py-3 text-white/55">{formatOMRLabel(v.gmv)}</td>
                  <td className="px-4 py-3 text-white/45">{v.last ? new Date(v.last).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {!data?.venues.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                    No payments yet. Pay a table on a phone to see revenue land here.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-extrabold">Recent payments</h2>
          <ul className="mt-3 space-y-2">
            {(data?.payments ?? []).slice(0, 12).map((p) => (
              <li key={p.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">
                    {p.venue} · Table {p.table}
                  </span>
                  <span className="text-violet-300">{formatOMRLabel(p.feeBaisa)} fee</span>
                </div>
                <div className="mt-1 text-xs text-white/45">
                  {methodLabel(p.method)} · bill {formatOMR(p.billBaisa)} · tip {formatOMR(p.tipBaisa)} ·{" "}
                  {new Date(p.at).toLocaleTimeString()}
                </div>
              </li>
            ))}
            {!data?.payments.length ? <li className="text-sm text-white/40">Waiting for the first tap.</li> : null}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-extrabold">Pipeline</h2>
          {note ? <p className="mt-2 text-xs font-semibold text-violet-200">{note}</p> : null}
          <ul className="mt-3 space-y-2">
            {(data?.applications ?? []).slice(0, 8).map((a) => (
              <li key={a.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{a.venueName}</div>
                    <div className="text-xs text-white/45">
                      {a.city} · {a.pos} · {a.status} · {a.id}
                    </div>
                  </div>
                  {a.status !== "approved" ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-full bg-violet-500 px-3 py-1 text-xs font-extrabold text-white"
                      onClick={async () => {
                        const res = await fetch("/api/hq", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "approve", id: a.id }),
                        });
                        const d = (await res.json()) as {
                          error?: string;
                          slug?: string;
                          ownerName?: string;
                          password?: string;
                        };
                        if (!res.ok) {
                          setNote(d.error || "Need Neon DATABASE_URL to approve.");
                          return;
                        }
                        setNote(`Live: /venue/${d.slug} · ${d.ownerName} / ${d.password}`);
                      }}
                    >
                      Approve
                    </button>
                  ) : (
                    <Link href="/venue" className="text-xs font-bold text-violet-200">
                      Open
                    </Link>
                  )}
                </div>
              </li>
            ))}
            {!data?.applications.length ? (
              <li className="text-sm text-white/40">
                New join applications appear here. Submit one at /join to test.
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-violet-400/40 bg-violet-500/10" : "border-white/10 bg-white/5"}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-white/40">{hint}</div>
    </div>
  );
}
