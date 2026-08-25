"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  billSplitFee,
  SPLIT_FEE_NAME,
  billSubtotal,
  billTotal,
  billVat,
  feeForItemSelection,
  feeForPayment,
  itemSubtotal,
  selectionTotal,
  type VenueBill,
} from "@/lib/bills";
import { formatOMR, formatOMRLabel, parseOMRInput, percentOf, shareOf } from "@/lib/money";
import {
  applyPayment,
  clearPending,
  loadSession,
  remainingBaisa,
  remainingFee,
  resetSession,
  savePending,
  type TableSession,
} from "@/lib/pay-session";
import { methodLabel as gatewayMethodLabel } from "@/lib/payments/public";
import type { PaymentMethodId } from "@/lib/payments/public";
import { pushAlert } from "@/lib/staff-alerts";
import { GuestFrame } from "./GuestFrame";
import { GuestMenu, type CartLine } from "./GuestMenu";
import { TableShare } from "./TableShare";
import { useDiner } from "@/components/GuestAuth";
import type { MenuItem } from "@/lib/menu";

type Step = "menu" | "bill" | "split" | "tip" | "pay" | "done";
type SplitMode = "full" | "equal" | "item" | "custom";

const STEPS: Step[] = ["bill", "split", "tip", "pay"];

export function PayApp({ bill: initial, slug }: { bill: VenueBill; slug: string }) {
  const [bill, setBill] = useState(initial);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderBusy, setOrderBusy] = useState(false);
  const [sent, setSent] = useState("");
  const [session, setSession] = useState<TableSession>({
    code: bill.code,
    paidBaisa: 0,
    paidFeeBaisa: 0,
    payments: [],
  });
  const [step, setStep] = useState<Step>(initial.items.length ? "bill" : "menu");
  const diner = useDiner();

  useEffect(() => {
    const pull = () => {
      fetch(`/api/till?code=${encodeURIComponent(bill.code)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { bill?: VenueBill } | null) => {
          if (d?.bill) setBill(d.bill);
        })
        .catch(() => undefined);
      fetch(`/api/sync?code=${encodeURIComponent(bill.code)}`)
        .then((r) => r.json())
        .then((d: { session?: typeof session }) => {
          if (d.session) setSession(d.session);
        })
        .catch(() => undefined);
    };
    pull();
    const id = window.setInterval(pull, 1500);
    return () => window.clearInterval(id);
  }, [bill.code]);

  useEffect(() => {
    if (!diner || !slug) return;
    fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, code: bill.code, name: diner.name, phone: diner.phone }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { guest?: { name: string; phone: string } } | null) => {
        if (d?.guest) setBill((b) => ({ ...b, guestName: d.guest!.name, guestPhone: d.guest!.phone }));
      })
      .catch(() => undefined);
  }, [diner?.id, bill.code, slug]);
  const [splitMode, setSplitMode] = useState<SplitMode>("full");
  const [people, setPeople] = useState(2);
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [customRaw, setCustomRaw] = useState("");
  const [tipPct, setTipPct] = useState<number | "custom">(15);
  const [customTipRaw, setCustomTipRaw] = useState("");
  const [method, setMethod] = useState<PaymentMethodId>("apple");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [cardError, setCardError] = useState("");
  const [busy, setBusy] = useState(false);
  const [gatewayMode, setGatewayMode] = useState<"live" | "stub">("stub");
  const [lastPay, setLastPay] = useState<{
    billBaisa: number;
    foodBaisa: number;
    feeBaisa: number;
    tipBaisa: number;
    method: PaymentMethodId;
  } | null>(null);
  const [waiter, setWaiter] = useState("");
  const [stars, setStars] = useState(0);

  useEffect(() => {
    fetch("/api/pay/status")
      .then((r) => r.json())
      .then((d: { mode?: "live" | "stub" }) => {
        if (d.mode === "live") setGatewayMode("live");
      })
      .catch(() => undefined);
  }, []);

  const remaining = remainingBaisa(bill, session);
  const leftoverFee = remainingFee(bill, session);
  const settled = remaining === 0;

  const payBaisa = useMemo(() => {
    if (splitMode === "full") return remaining;
    if (splitMode === "equal") return Math.min(shareOf(remaining, people), remaining);
    if (splitMode === "item") return Math.min(selectionTotal(bill, selectedQty, leftoverFee), remaining);
    return Math.min(parseOMRInput(customRaw), remaining);
  }, [splitMode, remaining, people, selectedQty, customRaw, bill, leftoverFee]);

  const feeBaisa = useMemo(() => {
    if (splitMode === "item") return feeForItemSelection(bill, selectedQty, leftoverFee);
    return feeForPayment(payBaisa, remaining, leftoverFee, splitMode === "equal" ? people : 1);
  }, [splitMode, bill, selectedQty, leftoverFee, payBaisa, remaining, people]);

  const foodBaisa = Math.max(0, payBaisa - feeBaisa);
  const tipBaisa = tipPct === "custom" ? parseOMRInput(customTipRaw) : percentOf(foodBaisa, tipPct);
  const chargeBaisa = payBaisa + tipBaisa;

  function addToCart(item: MenuItem) {
    setCart((cur) => {
      const hit = cur.find((l) => l.name === item.name);
      if (hit) return cur.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l));
      return [...cur, { name: item.name, qty: 1, omr: item.omr, detail: item.detail }];
    });
  }

  function bumpCart(name: string, delta: number) {
    setCart((cur) =>
      cur
        .map((l) => (l.name === name ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  async function sendOrder() {
    if (!cart.length || orderBusy) return;
    setOrderBusy(true);
    setSent("");
    try {
      const res = await fetch("/api/till", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "order", code: bill.code, items: cart }),
      });
      const data = (await res.json()) as { bill?: VenueBill; error?: string };
      if (!res.ok || !data.bill) {
        setSent(data.error || "Could not send. Ask the waiter.");
        setOrderBusy(false);
        return;
      }
      setBill(data.bill);
      setCart([]);
      setSent("Sent to the café. Eat — pay when you are ready.");
      setOrderBusy(false);
    } catch {
      setSent("Could not send. Ask the waiter.");
      setOrderBusy(false);
    }
  }

  function startFull() {
    setSplitMode("full");
    setStep("tip");
  }

  function startSplit() {
    setSplitMode("equal");
    setStep("split");
  }

  function confirmSplit() {
    if (payBaisa <= 0) return;
    setStep("tip");
  }

  async function confirmPay() {
    if (payBaisa <= 0 || remaining <= 0) return;
    if (method === "card" && gatewayMode === "stub" && !validCard(card)) {
      setCardError("Enter a 16-digit card, expiry, CVC, and name. Demo only — you will not be charged.");
      return;
    }
    setCardError("");
    setBusy(true);

    const finish = async (sessionId?: string) => {
      const payment = {
        method,
        billBaisa: payBaisa,
        foodBaisa,
        feeBaisa,
        tipBaisa,
        splitLabel: splitLabel(splitMode, people),
        gatewaySessionId: sessionId,
        provider: method === "restaurant" ? "restaurant" : "amwal",
        payerName: diner?.name,
      };
      let next = applyPayment(session, payment);
      try {
        const synced = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pay", code: bill.code, payment }),
        });
        const data = (await synced.json()) as { session?: typeof session };
        if (data.session) next = data.session;
      } catch {
        /* local copy still applied */
      }
      clearPending(bill.code);
      if (bill.posOrderId) {
        fetch("/api/pos/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: bill.posOrderId }),
        }).catch(() => undefined);
      }
      setSession(next);
      setLastPay({ billBaisa: payBaisa, foodBaisa, feeBaisa, tipBaisa, method });
      setBusy(false);
      setStep("done");
    };

    if (method === "restaurant") {
      const alert = {
        type: "restaurant-pay" as const,
        table: bill.table,
        venue: bill.venue,
        message: `Table ${bill.table} wants to pay ${bill.server} at the table`,
      };
      pushAlert({ ...alert, code: bill.code });
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "waiter", code: bill.code, alert }),
      }).catch(() => undefined);
      await wait(800);
      await finish(`rest_${Date.now()}`);
      return;
    }

    const payload = {
      code: bill.code,
      amountBaisa: chargeBaisa,
      foodBaisa,
      feeBaisa,
      tipBaisa,
      method,
    };

    try {
      const res = await fetch("/api/pay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        checkoutUrl?: string;
        sessionId?: string;
        mode?: string;
      };
      if (!res.ok) {
        setCardError(data.error || "Payment could not be started. Try again.");
        setBusy(false);
        return;
      }

      savePending(bill.code, {
        sessionId: data.sessionId || `spl_${Date.now()}`,
        foodBaisa,
        feeBaisa,
        tipBaisa,
        billBaisa: payBaisa,
        splitLabel: splitLabel(splitMode, people),
        method,
      });

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      await wait(1400);
      await finish(data.sessionId);
    } catch {
      setCardError("Could not start payment. Try again.");
      setBusy(false);
    }
  }

  function payMore() {
    setSplitMode("full");
    setSelectedQty({});
    setCustomRaw("");
    setTipPct(15);
    setLastPay(null);
    setStars(0);
    setStep("bill");
  }

  function resetDemo() {
    setSession(resetSession(bill.code));
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", code: bill.code }),
    }).catch(() => undefined);
    payMore();
  }

  function callWaiter() {
    const alert = {
      type: "waiter" as const,
      table: bill.table,
      venue: bill.venue,
      message: `Table ${bill.table} called for ${bill.server}`,
    };
    try {
      pushAlert({ ...alert, code: bill.code });
    } catch {
      /* local copy is optional — staff tablet reads the server */
    }
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "waiter", code: bill.code, alert }),
    }).catch(() => undefined);
    setWaiter(`Asked ${bill.server} to come to table ${bill.table}. They’ll see it on the staff tablet.`);
    window.setTimeout(() => setWaiter(""), 4000);
  }

  return (
    <GuestFrame venue={bill.venue} table={bill.table}>
      {step !== "done" && step !== "menu" ? <Progress step={step} /> : null}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {step === "menu" && (
          <GuestMenu
            slug={slug}
            cart={cart}
            onAdd={addToCart}
            onBump={bumpCart}
            onSend={sendOrder}
            busy={orderBusy}
            sent={sent}
            hasBill={bill.items.length > 0}
            onSeeBill={() => setStep("bill")}
          />
        )}
        {step === "bill" && (
          <BillStep
            bill={bill}
            slug={slug}
            remaining={remaining}
            session={session}
            dinerName={diner?.name}
            onWaiter={callWaiter}
            onReset={resetDemo}
            onBill={setBill}
            onOrderMore={() => {
              setSent("");
              setStep("menu");
            }}
          />
        )}
        {step === "split" && (
          <SplitStep
            bill={bill}
            remaining={remaining}
            mode={splitMode}
            setMode={setSplitMode}
            people={people}
            setPeople={setPeople}
            selectedQty={selectedQty}
            setSelectedQty={setSelectedQty}
            customRaw={customRaw}
            setCustomRaw={setCustomRaw}
            payBaisa={payBaisa}
            feeBaisa={feeBaisa}
          />
        )}
        {step === "tip" && (
          <TipStep
            server={bill.server}
            foodBaisa={foodBaisa}
            feeBaisa={feeBaisa}
            tipPct={tipPct}
            setTipPct={setTipPct}
            customTipRaw={customTipRaw}
            setCustomTipRaw={setCustomTipRaw}
            tipBaisa={tipBaisa}
          />
        )}
        {step === "pay" && (
          <PayStep
            foodBaisa={foodBaisa}
            feeBaisa={feeBaisa}
            tipBaisa={tipBaisa}
            chargeBaisa={chargeBaisa}
            method={method}
            setMethod={setMethod}
            card={card}
            setCard={setCard}
            cardError={cardError}
            busy={busy}
            server={bill.server}
          />
        )}
        {step === "done" && lastPay && (
          <DoneStep
            bill={bill}
            lastPay={lastPay}
            remaining={remaining}
            session={session}
            stars={stars}
            setStars={setStars}
            onMore={payMore}
            onReset={resetDemo}
          />
        )}
      </div>

      {waiter ? (
        <div className="mx-4 mb-2 rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white">
          {waiter}
        </div>
      ) : null}

      {step !== "done" && step !== "menu" && !settled && bill.items.length > 0 ? (
        <div className="border-t border-line bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {step === "bill" ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={startSplit}
                className="rounded-full border border-line py-3 text-sm font-bold"
              >
                Split the bill
              </button>
              <button
                type="button"
                onClick={startFull}
                className="rounded-full bg-split py-3 text-sm font-bold text-white"
              >
                Pay {formatOMRLabel(remaining)}
              </button>
            </div>
          ) : null}
          {step === "split" ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("bill")} className="rounded-full border border-line px-4 py-3 text-sm font-bold">
                Back
              </button>
              <button
                type="button"
                disabled={payBaisa <= 0}
                onClick={confirmSplit}
                className="flex-1 rounded-full bg-split py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                Continue with {formatOMRLabel(payBaisa)}
              </button>
            </div>
          ) : null}
          {step === "tip" ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(splitMode === "full" ? "bill" : "split")}
                className="rounded-full border border-line px-4 py-3 text-sm font-bold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep("pay")}
                className="flex-1 rounded-full bg-ink py-3 text-sm font-bold text-white"
              >
                {tipBaisa === 0 ? "Continue without tip" : `Add tip · ${formatOMRLabel(chargeBaisa)}`}
              </button>
            </div>
          ) : null}
          {step === "pay" ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("tip")} className="rounded-full border border-line px-4 py-3 text-sm font-bold" disabled={busy}>
                Back
              </button>
              <button
                type="button"
                onClick={confirmPay}
                disabled={busy || payBaisa <= 0}
                className="flex-1 rounded-full bg-split py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {busy
                  ? method === "restaurant"
                    ? "Notifying your server…"
                    : "Processing…"
                  : method === "restaurant"
                    ? `Pay in restaurant · ${formatOMRLabel(chargeBaisa)}`
                    : `Pay ${formatOMRLabel(chargeBaisa)}`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === "bill" && settled && bill.items.length > 0 ? (
        <div className="border-t border-line bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-center text-sm font-semibold text-split">This table is fully paid.</p>
          <button
            type="button"
            onClick={() => setStep("menu")}
            className="mb-2 w-full rounded-full border border-line py-3 text-sm font-bold"
          >
            Order more
          </button>
          <button type="button" onClick={resetDemo} className="w-full rounded-full bg-ink py-3 text-sm font-bold text-white">
            Reset demo table
          </button>
        </div>
      ) : null}
    </GuestFrame>
  );
}

function Progress({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step);
  return (
    <div className="mb-3 flex items-center justify-center gap-1.5 px-4">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div className={`h-1.5 w-10 rounded-full ${i <= idx ? "bg-split" : "bg-line"}`} />
        </div>
      ))}
    </div>
  );
}

function BillStep({
  bill,
  slug,
  remaining,
  session,
  dinerName,
  onWaiter,
  onReset,
  onOrderMore,
  onBill,
}: {
  bill: VenueBill;
  slug: string;
  remaining: number;
  session: TableSession;
  dinerName?: string;
  onWaiter: () => void;
  onReset: () => void;
  onOrderMore: () => void;
  onBill: (bill: VenueBill) => void;
}) {
  const total = billTotal(bill);
  const paid = session.paidBaisa;
  const [guestName, setGuestName] = useState(bill.guestName ?? "");
  const [guestPhone, setGuestPhone] = useState(bill.guestPhone ?? "");
  const [guestNote, setGuestNote] = useState("");
  const [guestBusy, setGuestBusy] = useState(false);

  async function saveGuest() {
    setGuestBusy(true);
    setGuestNote("");
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, code: bill.code, name: guestName, phone: guestPhone }),
    });
    const data = (await res.json()) as { error?: string; guest?: { name: string; phone: string } };
    setGuestBusy(false);
    if (!res.ok) {
      setGuestNote(data.error || "Could not save.");
      return;
    }
    onBill({ ...bill, guestName: data.guest?.name || guestName, guestPhone: data.guest?.phone || guestPhone });
    setGuestNote("Saved. Your name will be on the receipt.");
  }

  return (
    <div>
      <img src={bill.coverUrl} alt="" className="mb-4 h-36 w-full rounded-[1.4rem] object-cover" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-split">Your table</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Table {bill.table}</h1>
          <p className="text-sm text-muted">
            {bill.venue} · {bill.venueArea}
          </p>
          {bill.guestName ? <p className="mt-1 text-sm font-semibold">Welcome, {bill.guestName}</p> : null}
          {bill.pos === "foodics" ? (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-split">
              Open check from Foodics · stock stays in POS
            </p>
          ) : null}
        </div>
        <button type="button" onClick={onWaiter} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold">
          Call waiter
        </button>
      </div>

      <button
        type="button"
        onClick={onOrderMore}
        className="mt-4 w-full rounded-[1.4rem] border border-dashed border-split/40 bg-lilac px-4 py-3 text-sm font-extrabold text-split"
      >
        + Order more food
      </button>

      {dinerName ? (
        <p className="mt-3 rounded-[1.4rem] bg-lilac px-4 py-3 text-sm font-semibold">
          Paying as {dinerName}. Friends log in too so their names show when they pay.
        </p>
      ) : (
      <div className="mt-3 rounded-[1.4rem] bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-split">Your account</p>
        <p className="mt-1 text-[11px] text-muted">Save your name so it prints on the receipt. Or tap Log in at the top.</p>
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Your name"
          className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
        />
        <input
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          placeholder="Phone"
          className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={guestBusy}
          onClick={() => void saveGuest()}
          className="mt-2 w-full rounded-full bg-sand py-2 text-xs font-extrabold"
        >
          {guestBusy ? "Saving…" : "Save my name"}
        </button>
        {guestNote ? <p className="mt-2 text-xs font-semibold">{guestNote}</p> : null}
      </div>
      )}

      <div className="mt-3">
        <TableShare bill={bill} session={session} remaining={remaining} />
      </div>

      <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white">
        {bill.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Nothing on the bill yet. Order from the menu first.</p>
        ) : null}
        {bill.items.map((item) => (
          <div key={item.id} className="flex items-start justify-between border-b border-line px-4 py-3 last:border-0">
            <div>
              <div className="text-sm font-semibold">
                {item.qty > 1 ? `${item.qty}× ` : ""}
                {item.name}
              </div>
              {item.detail ? <div className="text-[11px] text-muted">{item.detail}</div> : null}
            </div>
            <div className="text-sm font-bold">{formatOMR(itemSubtotal(item))}</div>
          </div>
        ))}
        <div className="space-y-1 bg-sand px-4 py-3 text-sm">
          <Row label="Subtotal" value={formatOMR(billSubtotal(bill))} />
          <Row label={`VAT ${Math.round(bill.vatRate * 100)}%`} value={formatOMR(billVat(bill))} />
          <Row label={SPLIT_FEE_NAME} value={formatOMR(billSplitFee(bill))} />
          <Row label="Bill total" value={formatOMRLabel(total)} bold />
          {paid > 0 ? <Row label="Already paid" value={`− ${formatOMR(paid)}`} /> : null}
          <Row label="Remaining" value={formatOMRLabel(remaining)} bold />
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted">
        {SPLIT_FEE_NAME} is OMR 0.203 per table ·{" "}
        <button type="button" onClick={onReset} className="font-semibold text-split">
          Reset table
        </button>
      </p>
    </div>
  );
}

function SplitStep({
  bill,
  remaining,
  mode,
  setMode,
  people,
  setPeople,
  selectedQty,
  setSelectedQty,
  customRaw,
  setCustomRaw,
  payBaisa,
  feeBaisa,
}: {
  bill: VenueBill;
  remaining: number;
  mode: SplitMode;
  setMode: (m: SplitMode) => void;
  people: number;
  setPeople: (n: number) => void;
  selectedQty: Record<string, number>;
  setSelectedQty: (q: Record<string, number>) => void;
  customRaw: string;
  setCustomRaw: (v: string) => void;
  payBaisa: number;
  feeBaisa: number;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-split">Split</p>
      <h1 className="text-2xl font-extrabold tracking-tight">How do you want to split?</h1>
      <p className="text-sm text-muted">Remaining {formatOMRLabel(remaining)}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(
          [
            ["equal", "Equally"],
            ["item", "By item"],
            ["custom", "Custom"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-2xl py-3 text-sm font-bold ${
              mode === id ? "bg-split text-white" : "bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "equal" && (
        <div className="mt-5 rounded-[1.4rem] bg-white p-5 text-center">
          <p className="text-sm text-muted">Number of people</p>
          <div className="mt-3 flex items-center justify-center gap-6">
            <Stepper value={people} min={2} max={12} onChange={setPeople} />
          </div>
          <p className="mt-4 text-xs text-muted">Your share</p>
          <p className="text-3xl font-extrabold">{formatOMRLabel(payBaisa)}</p>
          <p className="mt-1 text-[11px] text-muted">
            Includes {formatOMRLabel(feeBaisa)} {SPLIT_FEE_NAME}
          </p>
        </div>
      )}

      {mode === "item" && (
        <div className="mt-5 overflow-hidden rounded-[1.4rem] bg-white">
          {bill.items.map((item) => {
            const qty = selectedQty[item.id] ?? 0;
            return (
              <div key={item.id} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-[11px] text-muted">
                    {formatOMR(item.unitBaisa)} each · up to {item.qty}
                  </div>
                </div>
                <Stepper
                  value={qty}
                  min={0}
                  max={item.qty}
                  onChange={(n) => setSelectedQty({ ...selectedQty, [item.id]: n })}
                />
              </div>
            );
          })}
        </div>
      )}

      {mode === "custom" && (
        <div className="mt-5 rounded-[1.4rem] bg-white p-5">
          <label className="text-sm font-semibold">Your amount</label>
          <div className="mt-2 flex items-center rounded-2xl border border-line px-4 py-3">
            <span className="mr-2 text-sm font-bold text-muted">OMR</span>
            <input
              inputMode="decimal"
              value={customRaw}
              onChange={(e) => setCustomRaw(e.target.value)}
              placeholder="0.000"
              className="w-full bg-transparent text-2xl font-extrabold outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            {[25, 50, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setCustomRaw(formatOMR(Math.round((remaining * pct) / 100)))}
                className="flex-1 rounded-full bg-lilac py-2 text-xs font-bold text-split"
              >
                {pct === 100 ? "All" : `${pct}%`}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-sm font-semibold">
        You will pay {formatOMRLabel(payBaisa)}
        {feeBaisa > 0 ? ` · ${formatOMRLabel(feeBaisa)} ${SPLIT_FEE_NAME}` : ""}
      </p>
    </div>
  );
}

function TipStep({
  server,
  foodBaisa,
  feeBaisa,
  tipPct,
  setTipPct,
  customTipRaw,
  setCustomTipRaw,
  tipBaisa,
}: {
  server: string;
  foodBaisa: number;
  feeBaisa: number;
  tipPct: number | "custom";
  setTipPct: (v: number | "custom") => void;
  customTipRaw: string;
  setCustomTipRaw: (v: string) => void;
  tipBaisa: number;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-split">Tip</p>
      <h1 className="text-2xl font-extrabold tracking-tight">Say thanks to {server}</h1>
      <p className="text-sm text-muted">Tip is calculated on your food share, not {SPLIT_FEE_NAME}.</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[0, 10, 12, 15, 20].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setTipPct(p)}
            className={`rounded-2xl py-4 text-sm font-bold ${
              tipPct === p ? "bg-split text-white" : "bg-white"
            }`}
          >
            {p === 0 ? "No tip" : `${p}%`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTipPct("custom")}
          className={`rounded-2xl py-4 text-sm font-bold ${
            tipPct === "custom" ? "bg-split text-white" : "bg-white"
          }`}
        >
          Custom
        </button>
      </div>

      {tipPct === "custom" ? (
        <div className="mt-4 flex items-center rounded-2xl border border-line bg-white px-4 py-3">
          <span className="mr-2 text-sm font-bold text-muted">OMR</span>
          <input
            inputMode="decimal"
            value={customTipRaw}
            onChange={(e) => setCustomTipRaw(e.target.value)}
            placeholder="0.000"
            className="w-full bg-transparent text-xl font-extrabold outline-none"
          />
        </div>
      ) : null}

      <div className="mt-5 rounded-[1.4rem] bg-white p-5 text-sm">
        <Row label="Food + VAT" value={formatOMRLabel(foodBaisa)} />
        <Row label={SPLIT_FEE_NAME} value={formatOMRLabel(feeBaisa)} />
        <Row label="Tip" value={formatOMRLabel(tipBaisa)} />
        <div className="mt-2 border-t border-line pt-2">
          <Row label="Total" value={formatOMRLabel(foodBaisa + feeBaisa + tipBaisa)} bold />
        </div>
      </div>
    </div>
  );
}

function PayStep({
  foodBaisa,
  feeBaisa,
  tipBaisa,
  chargeBaisa,
  method,
  setMethod,
  card,
  setCard,
  cardError,
  busy,
  server,
}: {
  foodBaisa: number;
  feeBaisa: number;
  tipBaisa: number;
  chargeBaisa: number;
  method: PaymentMethodId;
  setMethod: (m: PaymentMethodId) => void;
  card: { number: string; expiry: string; cvc: string; name: string };
  setCard: (c: { number: string; expiry: string; cvc: string; name: string }) => void;
  cardError: string;
  busy: boolean;
  server: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-split">Pay</p>
      <h1 className="text-2xl font-extrabold tracking-tight">How would you like to pay?</h1>
      <p className="text-sm text-muted">Pay on your phone, or settle with {server} at the table.</p>

      <div className="mt-4 rounded-[1.4rem] bg-white p-4">
        <Row label="Food + VAT" value={formatOMRLabel(foodBaisa)} />
        <Row label={SPLIT_FEE_NAME} value={formatOMRLabel(feeBaisa)} />
        <Row label="Tip" value={formatOMRLabel(tipBaisa)} />
        <div className="mt-2 border-t border-line pt-2">
          <Row label="You pay" value={formatOMRLabel(chargeBaisa)} bold />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {(
          [
            ["apple", "Apple Pay", "Pay with Face ID or Touch ID"],
            ["google", "Google Pay", "Pay with your saved Google account"],
            ["card", "Card", "Debit or credit card"],
            ["restaurant", "Pay in restaurant", `Cash or card with ${server}`],
          ] as const
        ).map(([id, label, hint]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${
              method === id ? "bg-ink text-white" : "bg-white"
            }`}
          >
            <span>
              <span className="block text-sm font-bold">{label}</span>
              <span className={`block text-[11px] ${method === id ? "text-white/70" : "text-muted"}`}>{hint}</span>
            </span>
            <span className="text-xs font-semibold opacity-70">{method === id ? "Selected" : ""}</span>
          </button>
        ))}
      </div>

      {method === "card" ? (
        <div className="mt-4 space-y-2 rounded-[1.4rem] bg-white p-4">
          <input
            value={card.number}
            onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
            placeholder="Card number"
            inputMode="numeric"
            autoComplete="cc-number"
            className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-split"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={card.expiry}
              onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-split"
            />
            <input
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="CVC"
              inputMode="numeric"
              autoComplete="cc-csc"
              className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-split"
            />
          </div>
          <input
            value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value })}
            placeholder="Name on card"
            autoComplete="cc-name"
            className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-split"
          />
        </div>
      ) : null}
      {cardError ? <p className="mt-3 text-xs font-semibold text-red-600">{cardError}</p> : null}
      {busy ? (
        <p className="mt-4 text-center text-sm font-semibold text-split">
          {method === "restaurant" ? `Letting ${server} know…` : "Processing payment…"}
        </p>
      ) : null}
    </div>
  );
}

function DoneStep({
  bill,
  lastPay,
  remaining,
  session,
  stars,
  setStars,
  onMore,
  onReset,
}: {
  bill: VenueBill;
  lastPay: {
    billBaisa: number;
    foodBaisa: number;
    feeBaisa: number;
    tipBaisa: number;
    method: PaymentMethodId;
  };
  remaining: number;
  session: TableSession;
  stars: number;
  setStars: (n: number) => void;
  onMore: () => void;
  onReset: () => void;
}) {
  return (
    <div className="pb-6">
      <div className="pop-in mx-auto mt-4 grid h-20 w-20 place-items-center rounded-full bg-split text-3xl text-white">
        {lastPay.method === "restaurant" ? "◎" : "✓"}
      </div>
      <h1 className="mt-4 text-center text-3xl font-extrabold tracking-tight">
        {lastPay.method === "restaurant" ? "Server notified" : "Paid"}
      </h1>
      <p className="text-center text-sm text-muted">
        {lastPay.method === "restaurant"
          ? `Pay ${bill.server} at table ${bill.table}`
          : formatOMRLabel(lastPay.billBaisa + lastPay.tipBaisa)}{" "}
        · {gatewayMethodLabel(lastPay.method)}
      </p>

      <div className="mt-6 rounded-[1.4rem] bg-white p-4 text-sm">
        <Row label="Restaurant" value={bill.venue} />
        <Row label="Table" value={bill.table} />
        <Row label="Food + VAT" value={formatOMRLabel(lastPay.foodBaisa)} />
        <Row label={SPLIT_FEE_NAME} value={formatOMRLabel(lastPay.feeBaisa)} />
        <Row label={`Tip for ${bill.server}`} value={formatOMRLabel(lastPay.tipBaisa)} />
        <Row label="Method" value={gatewayMethodLabel(lastPay.method)} />
      </div>
      {lastPay.method === "restaurant" ? (
        <p className="mt-3 text-center text-sm font-semibold text-split">
          {bill.server} will collect {formatOMRLabel(lastPay.billBaisa + lastPay.tipBaisa)} at the table.
        </p>
      ) : null}

      {remaining > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-[1.4rem] bg-lilac p-4 text-center">
            <p className="text-sm font-semibold">Your share is in. Friends still owe</p>
            <p className="text-2xl font-extrabold">{formatOMRLabel(remaining)}</p>
            <p className="mt-1 text-xs text-muted">They scan the same table QR. This screen updates live.</p>
            <button type="button" onClick={onMore} className="mt-3 rounded-full bg-split px-5 py-2 text-sm font-bold text-white">
              Pay more of this bill
            </button>
          </div>
          <TableShare bill={bill} session={session} remaining={remaining} />
        </div>
      ) : (
        <p className="mt-4 text-center text-sm font-semibold text-split">The whole table is settled.</p>
      )}

      <div className="mt-6 rounded-[1.4rem] bg-white p-5 text-center">
        <p className="text-sm font-extrabold">How was dinner?</p>
        <div className="mt-2 flex justify-center gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setStars(n)} className={n <= stars ? "text-amber-400" : "text-line"}>
              ★
            </button>
          ))}
        </div>
        {stars > 0 ? (
          <p className="mt-2 text-xs text-muted">
            {stars >= 4 ? "Thanks — this would post to Google in a live venue." : "Thanks for the feedback. We’ll share it with the team."}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-[1.4rem] bg-gradient-to-br from-split to-split-bright p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">Split+</p>
        <p className="text-lg font-extrabold">Earn OMR 2.000 off your next visit</p>
        <p className="mt-1 text-xs text-white/80">Rewards at restaurants across Oman.</p>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link href="/pay" className="rounded-full bg-ink py-3 text-center text-sm font-bold text-white">
          Scan another table
        </Link>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-muted">
          Reset this demo table
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${bold ? "font-extrabold" : ""}`}>
      <span className={bold ? "" : "text-muted"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-9 w-9 place-items-center rounded-full bg-lilac text-lg font-bold text-split"
      >
        −
      </button>
      <span className="w-6 text-center text-lg font-extrabold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-9 w-9 place-items-center rounded-full bg-lilac text-lg font-bold text-split"
      >
        +
      </button>
    </div>
  );
}

function splitLabel(mode: SplitMode, people: number) {
  if (mode === "full") return "Paid in full";
  if (mode === "equal") return `Split equally × ${people}`;
  if (mode === "item") return "Split by item";
  return "Custom amount";
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function validCard(card: { number: string; expiry: string; cvc: string; name: string }) {
  const num = card.number.replace(/\s/g, "");
  return num.length === 16 && /^\d{2}\/\d{2}$/.test(card.expiry) && card.cvc.length >= 3 && card.name.trim().length >= 2;
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
