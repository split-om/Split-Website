"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

type PosId = "foodics" | "micros" | "toast" | "lightspeed" | "square" | "revel" | "tablet";

type PosSystem = {
  id: PosId;
  name: string;
  where: string;
  connectHow: string;
  canReadCheck: boolean;
  canMarkPaid: boolean;
  canSendOrder: boolean;
  inventory: string;
  docs: string;
};

type LabState = {
  connected: Partial<Record<PosId, string>>;
  lastCheck: Partial<Record<PosId, { at: string; status: "open" | "paid" }>>;
  log: Array<{ at: string; pos: PosId; action: string; detail: string }>;
};

type Mapped = {
  posCheckId: string;
  venue: string;
  table: string;
  items: Array<{ name: string; qty: number; omr: number }>;
  foodVat: number;
};

export function PosLab() {
  const [systems, setSystems] = useState<PosSystem[]>([]);
  const [lab, setLab] = useState<LabState>({ connected: {}, lastCheck: {}, log: [] });
  const [active, setActive] = useState<PosId>("foodics");
  const [raw, setRaw] = useState<object | null>(null);
  const [mapped, setMapped] = useState<Mapped | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/pos/lab")
      .then((r) => r.json())
      .then((d: { systems: PosSystem[]; lab: LabState }) => {
        setSystems(d.systems);
        setLab(d.lab);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  const pos = systems.find((s) => s.id === active);

  async function act(action: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/pos/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, pos: active }),
      });
      const data = (await res.json()) as {
        error?: string;
        lab?: LabState;
        raw?: object;
        mapped?: Mapped;
      };
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        if (data.lab) setLab(data.lab);
        if (data.raw) setRaw(data.raw);
        if (data.mapped) setMapped(data.mapped);
        if (action !== "fetch") load();
      }
    } catch {
      setError("Could not reach the POS lab.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Logo invert />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">POS practice lab</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Same four moves for every till: connect → pull the open check → guest pays on Split → mark that check
            paid on the POS. Inventory never lives here.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/hq/pos/foodics" className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold">
            Foodics steps
          </Link>
          <Link href="/hq" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
            ← HQ
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {systems.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActive(s.id);
                setRaw(null);
                setMapped(null);
                setError("");
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                active === s.id ? "border-violet-400 bg-violet-500/15" : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold">{s.name}</span>
                {lab.connected[s.id] ? (
                  <span className="text-[10px] font-bold uppercase text-emerald-300">On</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-white/35">Off</span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-white/45">{s.where}</div>
            </button>
          ))}
        </aside>

        {pos ? (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-extrabold">{pos.name}</h2>
            <p className="mt-1 text-sm text-white/55">{pos.where}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="How you connect" v={pos.connectHow} />
              <Row k="Read open check" v={pos.canReadCheck ? "Yes" : "No"} />
              <Row k="Mark paid" v={pos.canMarkPaid ? "Yes" : "No"} />
              <Row k="Send QR order in" v={pos.canSendOrder ? "Yes (practice)" : "Not in v1 — Pay-at-Table only"} />
              <Row k="Inventory" v={pos.inventory} />
              <Row k="Docs to study" v={pos.docs} />
            </dl>

            <ol className="mt-6 grid gap-2 sm:grid-cols-4">
              {[
                ["1. Connect", "connect", "Authorise sandbox"],
                ["2. Fetch check", "fetch", "Pull + map the bill"],
                ["3. Mark paid", "pay", "After guest pays"],
                ["4. Send order", "order", "QR order-in (if allowed)"],
              ].map(([label, action, hint]) => (
                <button
                  key={action}
                  type="button"
                  disabled={busy}
                  onClick={() => act(action)}
                  className="rounded-2xl bg-ink px-3 py-3 text-left disabled:opacity-40"
                >
                  <div className="text-sm font-extrabold">{label}</div>
                  <div className="text-[11px] text-white/45">{hint}</div>
                </button>
              ))}
            </ol>
            {error ? <p className="mt-3 text-sm font-semibold text-amber-300">{error}</p> : null}

            {mapped ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">What Split shows the guest</h3>
                  <div className="mt-2 rounded-2xl bg-[#111] p-4 text-sm">
                    <p className="font-extrabold">
                      {mapped.venue} · Table {mapped.table}
                    </p>
                    <p className="text-xs text-white/40">POS check {mapped.posCheckId}</p>
                    <ul className="mt-3 space-y-1">
                      {mapped.items.map((i) => (
                        <li key={i.name} className="flex justify-between">
                          <span>
                            {i.qty}× {i.name}
                          </span>
                          <span>{i.omr.toFixed(3)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 flex justify-between border-t border-white/10 pt-2 font-extrabold">
                      <span>Food + VAT</span>
                      <span>OMR {mapped.foodVat.toFixed(3)}</span>
                    </p>
                    <p className="mt-1 flex justify-between text-violet-300">
                      <span>Split’s fee</span>
                      <span>OMR 0.203</span>
                    </p>
                    <p className="mt-2 text-[11px] text-white/40">
                      Status: {lab.lastCheck[active]?.status ?? "open"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">Raw POS payload (practice mapping)</h3>
                  <pre className="mt-2 max-h-80 overflow-auto rounded-2xl bg-[#111] p-4 text-[11px] leading-5 text-emerald-200">
                    {JSON.stringify(raw, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-white/40">Connect, then fetch a check to see raw JSON vs the mapped bill.</p>
            )}
          </section>
        ) : null}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/45">Practice log</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {lab.log.slice(0, 12).map((l, i) => (
            <li key={`${l.at}-${i}`} className="text-white/55">
              <span className="text-white/30">{new Date(l.at).toLocaleTimeString()}</span> · {l.pos} · {l.action} — {l.detail}
            </li>
          ))}
          {!lab.log.length ? <li className="text-white/35">No drills yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-white/35">{k}</dt>
      <dd className="text-white/80">{v}</dd>
    </div>
  );
}
