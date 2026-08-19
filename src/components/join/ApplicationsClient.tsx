"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearApplications,
  loadApplications,
  posPlan,
  productLabel,
  venueTypeLabel,
  type JoinApplication,
} from "@/lib/join";

export function ApplicationsClient() {
  const [apps, setApps] = useState<JoinApplication[]>([]);

  useEffect(() => {
    setApps(loadApplications());
  }, []);

  function wipe() {
    clearApplications();
    setApps([]);
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Internal test inbox</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Venue applications</h1>
          <p className="mt-2 text-muted">What Split would see after a restaurant or café joins.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/join" className="rounded-full bg-split px-5 py-2.5 text-sm font-bold text-white">
            New application
          </Link>
          {apps.length > 0 ? (
            <button type="button" onClick={wipe} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold">
              Clear tests
            </button>
          ) : null}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="mt-12 rounded-[2rem] border border-dashed border-line px-6 py-16 text-center">
          <p className="font-extrabold">No applications yet</p>
          <p className="mt-2 text-sm text-muted">Submit one from the join flow to see it land here.</p>
          <Link href="/join" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
            Open join flow
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {apps.map((app) => (
            <article key={app.id} className="rounded-[1.6rem] border border-line p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-split">{app.id}</p>
                  <h2 className="text-xl font-extrabold">{app.venueName}</h2>
                  <p className="text-sm text-muted">
                    {venueTypeLabel(app.venueType)} · {app.area ? `${app.area}, ` : ""}
                    {app.city}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-lilac px-3 py-1 text-xs font-bold text-split">{app.status}</span>
                  <span className="text-[11px] font-semibold text-muted">
                    {app.pos}
                    {app.posConnected ? " · POS connected" : ""}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm">
                {app.firstName} {app.lastName} · {app.role} · {app.email} · {app.phone}
              </p>
              <p className="mt-1 text-sm text-muted">
                {app.tables} tables · {app.pos} · {app.products.map(productLabel).join(", ")}
              </p>
              {app.notes ? <p className="mt-3 text-sm">{app.notes}</p> : null}
              <p className="mt-3 text-xs text-muted">{new Date(app.submittedAt).toLocaleString()}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-split">
                <Link href={`/join/connect?id=${app.id}`}>Connect POS →</Link>
                <Link href={`/pay/${posPlan(app.pos).guestTable}`}>Guest bill →</Link>
                <Link href={`/join/success?id=${app.id}`}>Confirmation →</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
