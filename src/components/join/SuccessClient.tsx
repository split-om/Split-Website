"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { findApplication, posPlan, productLabel, venueTypeLabel, type JoinApplication } from "@/lib/join";

export function SuccessClient() {
  const params = useSearchParams();
  const [app, setApp] = useState<JoinApplication | null>(null);

  useEffect(() => {
    const id = params.get("id") || "";
    setApp(findApplication(id) ?? null);
  }, [params]);

  if (!app) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">No application found</h1>
        <Link href="/join" className="mt-6 inline-flex rounded-full bg-split px-5 py-3 text-sm font-bold text-white">
          Start again
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Application {app.id}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">You are in the queue</h1>
      <p className="mt-3 text-lg text-muted">
        {app.venueName} is registered as a {venueTypeLabel(app.venueType).toLowerCase()} in {app.city}. Split HQ
        will approve the café — then you get a staff login, menu editor, and a QR for every table.
      </p>

      <div className="mt-8 rounded-[1.6rem] border border-line p-6">
        <h2 className="font-extrabold">How we connect {app.pos}</h2>
        <p className="mt-2 text-sm text-muted">{posPlan(app.pos).connect}</p>
        <ol className="mt-4 space-y-3 text-sm">
          <li>1. Connect the POS (Foodics sandbox is ready to try now).</li>
          <li>2. Payment methods: Apple Pay, Google Pay, card, or pay in restaurant.</li>
          <li>3. Table QR tents for {app.tables} tables.</li>
          <li>4. Go live with {app.products.map(productLabel).join(", ")}.</li>
        </ol>
      </div>

      <div className="mt-4 rounded-[1.6rem] bg-lilac p-6 text-sm">
        <p>
          <strong>Contact:</strong> {app.firstName} {app.lastName}, {app.role}
        </p>
        <p className="mt-1">
          {app.email} · {app.phone}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/join/connect?id=${app.id}`} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
          Connect POS
        </Link>
        <Link href="/venue/qahwa" className="rounded-full border border-line px-5 py-3 text-sm font-bold">
          Open café console
        </Link>
        <Link href={`/pay/${posPlan(app.pos).guestTable}`} className="rounded-full border border-line px-5 py-3 text-sm font-bold">
          Preview guest pay
        </Link>
        <Link href="/join/applications" className="rounded-full px-5 py-3 text-sm font-bold text-split">
          Applications inbox
        </Link>
      </div>
    </section>
  );
}
