"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  findApplication,
  posPlan,
  updateApplication,
  type JoinApplication,
} from "@/lib/join";

export function ConnectClient() {
  const params = useSearchParams();
  const [app, setApp] = useState<JoinApplication | null>(null);
  const [busy, setBusy] = useState(false);
  const [posMode, setPosMode] = useState("sandbox");

  useEffect(() => {
    const id = params.get("id") || "";
    setApp(findApplication(id) ?? null);
    fetch("/api/pos/status")
      .then((r) => r.json())
      .then((d: { mode?: string }) => {
        if (d.mode) setPosMode(d.mode);
      })
      .catch(() => undefined);
  }, [params]);

  if (!app) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">No application to connect</h1>
        <Link href="/join" className="mt-6 inline-flex rounded-full bg-split px-5 py-3 text-sm font-bold text-white">
          Join first
        </Link>
      </section>
    );
  }

  const plan = posPlan(app.pos);
  const applicationId = app.id;

  async function connect() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1100));
    const next = updateApplication(applicationId, {
      posConnected: true,
      posConnectedAt: new Date().toISOString(),
      status: "in-review",
    });
    if (next) setApp(next);
    setBusy(false);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">
        {app.id} · {app.venueName}
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">How we connect your POS</h1>
      <p className="mt-3 text-lg text-muted">{plan.connect}</p>

      <div className="mt-8 rounded-[1.6rem] border border-line p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-split">{plan.label}</p>
        <h2 className="mt-1 text-xl font-extrabold">{plan.headline}</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li>Split reads the open table bill. We do not replace your till.</li>
          <li>Guest pays on their phone (Apple Pay, Google Pay, card) or in restaurant.</li>
          <li>We mark that check paid on the POS. Stock stays in the POS.</li>
          {plan.mode === "api" ? (
            <li>QR ordering (later) posts the order into Foodics so kitchen and inventory update there.</li>
          ) : (
            <li>QR ordering and stock updates wait until this POS has a live API connection.</li>
          )}
        </ul>
      </div>

      {plan.id === "foodics" ? (
        <div className="mt-6 rounded-[1.6rem] bg-lilac p-6">
          <h3 className="font-extrabold">Foodics {posMode === "live" ? "live" : "sandbox"}</h3>
          <p className="mt-2 text-sm text-muted">
            {posMode === "live"
              ? "A Foodics token is configured. Connecting will use their OAuth in production."
              : "No Foodics token yet — this simulates the owner approving Split in the Foodics console."}
          </p>
          {app.posConnected ? (
            <p className="mt-4 text-sm font-semibold text-split">
              Connected {app.posConnectedAt ? new Date(app.posConnectedAt).toLocaleString() : ""}.
            </p>
          ) : (
            <button
              type="button"
              onClick={connect}
              disabled={busy}
              className="mt-4 rounded-full bg-split px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Authorising Foodics…" : "Connect Foodics sandbox"}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.6rem] bg-sand p-6 text-sm">
          <p className="font-semibold">No self-serve API for this POS yet.</p>
          <p className="mt-2 text-muted">
            You can still preview guest pay on a demo table. Go-live is a guided setup with the Split team.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/venue/qahwa" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
          Open café staff console
        </Link>
        <Link
          href={`/pay/${plan.guestTable}`}
          className="rounded-full border border-line px-5 py-3 text-sm font-bold"
        >
          Guest bill ({plan.guestTable.toUpperCase()})
        </Link>
        <Link href={`/join/success?id=${app.id}`} className="rounded-full border border-line px-5 py-3 text-sm font-bold">
          Back to application
        </Link>
      </div>
    </section>
  );
}
