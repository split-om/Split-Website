"use client";

import { formatOMR, formatOMRLabel, omrToBaisa } from "@/lib/money";
import { menuForVenue, type MenuItem } from "@/lib/menu";

export type CartLine = { name: string; qty: number; omr: number; detail?: string };

const CATS: MenuItem["category"][] = ["Drinks", "Food", "Sweets"];

export function GuestMenu({
  slug,
  cart,
  onAdd,
  onBump,
  onSend,
  busy,
  sent,
  hasBill,
  onSeeBill,
}: {
  slug: string;
  cart: CartLine[];
  onAdd: (item: MenuItem) => void;
  onBump: (name: string, delta: number) => void;
  onSend: () => void;
  busy: boolean;
  sent: string;
  hasBill: boolean;
  onSeeBill: () => void;
}) {
  const menu = menuForVenue(slug);
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + omrToBaisa(l.omr) * l.qty, 0);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-split">Order</p>
      <h1 className="text-2xl font-extrabold tracking-tight">What would you like?</h1>
      <p className="text-sm text-muted">Tap dishes. We send them to the café. Pay when you have eaten.</p>

      {CATS.map((cat) => (
        <section key={cat} className="mt-5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted">{cat}</h2>
          <ul className="mt-2 overflow-hidden rounded-[1.4rem] bg-white">
            {menu
              .filter((m) => m.category === cat)
              .map((m) => {
                const qty = cart.find((l) => l.name === m.name)?.qty ?? 0;
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">{m.name}</p>
                      {m.detail ? <p className="text-[11px] text-muted">{m.detail}</p> : null}
                      <p className="mt-0.5 text-xs font-semibold">{formatOMR(omrToBaisa(m.omr))}</p>
                    </div>
                    {qty > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onBump(m.name, -1)}
                          className="h-8 w-8 rounded-full bg-lilac text-lg font-bold"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm font-extrabold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => onAdd(m)}
                          className="h-8 w-8 rounded-full bg-split text-lg font-bold text-white"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAdd(m)}
                        className="h-8 w-8 shrink-0 rounded-full bg-split text-lg font-bold text-white"
                      >
                        +
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      {sent ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
          {sent}
        </p>
      ) : null}

      {hasBill ? (
        <button type="button" onClick={onSeeBill} className="mt-4 w-full text-center text-sm font-bold text-split">
          See your bill and pay →
        </button>
      ) : null}

      <div className="h-24" />

      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onSend}
          disabled={busy || count === 0}
          className="w-full rounded-full bg-split py-3.5 text-sm font-extrabold text-white disabled:opacity-40"
        >
          {busy
            ? "Sending to the café…"
            : count === 0
              ? "Add something first"
              : `Send ${count} item${count === 1 ? "" : "s"} · ${formatOMRLabel(total)}`}
        </button>
      </div>
    </div>
  );
}
