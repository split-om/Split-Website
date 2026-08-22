"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { AddToHomePrompt } from "./AddToHomePrompt";
import type { StaffAccess, StaffPublic } from "@/lib/staff-types";
import type { VenueProfile } from "@/lib/venue";

const key = (slug: string) => `split-staff-token:${slug}`;

const StaffSession = createContext<{ me: StaffPublic; signOut: () => void; token: string } | null>(null);

export function readStaffToken(slug: string) {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(key(slug)) ?? "";
}

export function StaffGate({
  venue,
  need,
  children,
}: {
  venue: VenueProfile;
  need?: keyof StaffAccess;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<StaffPublic | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = readStaffToken(venue.slug);
    if (!token) {
      setReady(true);
      return;
    }
    fetch(`/api/staff?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { me?: StaffPublic } | null) => {
        if (d?.me) setMe(d.me);
        else sessionStorage.removeItem(key(venue.slug));
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [venue.slug]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", slug: venue.slug, name, password }),
    });
    const data = (await res.json()) as { error?: string; token?: string; user?: StaffPublic };
    setBusy(false);
    if (!res.ok || !data.token || !data.user) {
      setError(data.error || "Could not sign in.");
      return;
    }
    sessionStorage.setItem(key(venue.slug), data.token);
    setMe(data.user);
  }

  function signOut() {
    const token = readStaffToken(venue.slug);
    fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", token }),
    }).catch(() => undefined);
    sessionStorage.removeItem(key(venue.slug));
    setMe(null);
  }

  if (!ready) {
    return <p className="px-6 py-16 text-center text-sm text-muted">Opening staff…</p>;
  }

  if (!me) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
        <Logo />
        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-split">Staff only</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{venue.name}</h1>
        <p className="mt-2 text-sm text-muted">Approved people only. Guests never see this.</p>
        <form onSubmit={signIn} className="mt-8 space-y-3">
          <label className="block text-sm font-semibold">
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-split"
              autoComplete="username"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-split"
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-split py-3 text-sm font-extrabold text-white disabled:opacity-40"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-xs text-muted">
          Demo: owner <strong>Aisha</strong> / <strong>owner123</strong> (menu + people). Waiter{" "}
          <strong>Noor</strong> / <strong>waiter123</strong> (floor + till only).
        </p>
      </div>
    );
  }

  if (need && !me.access[need]) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <Logo />
        <h1 className="mt-8 text-2xl font-extrabold">You don’t have this access</h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as {me.name}. Ask the owner to turn this on under People.
        </p>
        <button type="button" onClick={signOut} className="mt-6 text-sm font-bold text-split">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <StaffSession.Provider value={{ me, signOut, token: readStaffToken(venue.slug) }}>
      {children}
      <AddToHomePrompt slug={venue.slug} name={venue.name} />
    </StaffSession.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffSession);
  if (!ctx) throw new Error("useStaff must be inside StaffGate");
  return ctx;
}
