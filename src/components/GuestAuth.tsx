"use client";

import { useEffect, useState } from "react";

const TOKEN = "split-diner-token";

export type DinerPublic = { id: string; name: string; phone: string };

export function readDinerToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN) ?? "";
}

export function GuestAuth({ compact }: { compact?: boolean }) {
  const [me, setMe] = useState<DinerPublic | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = readDinerToken();
    if (!token) return;
    fetch(`/api/account?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { me?: DinerPublic } | null) => {
        if (d?.me) setMe(d.me);
        else localStorage.removeItem(TOKEN);
      })
      .catch(() => undefined);
  }, []);

  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: mode,
        name,
        phone,
        password,
      }),
    });
    const data = (await res.json()) as { error?: string; token?: string; user?: DinerPublic };
    setBusy(false);
    if (!res.ok || !data.token || !data.user) {
      setError(data.error || "Could not sign in.");
      return;
    }
    localStorage.setItem(TOKEN, data.token);
    setMe(data.user);
    setOpen(false);
    setPassword("");
  }

  function signOut() {
    const token = readDinerToken();
    fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", token }),
    }).catch(() => undefined);
    localStorage.removeItem(TOKEN);
    setMe(null);
    setOpen(false);
  }

  return (
    <>
      {me ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            compact
              ? "max-w-[9rem] truncate rounded-full bg-white px-3 py-1.5 text-xs font-extrabold"
              : "rounded-full border border-line px-4 py-2 text-sm font-semibold"
          }
        >
          Hi, {me.name.split(" ")[0]}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setOpen(true);
          }}
          className={
            compact
              ? "rounded-full bg-ink px-3 py-1.5 text-xs font-extrabold text-white"
              : "rounded-full border border-line px-4 py-2 text-sm font-semibold"
          }
        >
          Log in
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-[1.6rem] bg-white p-5 shadow-xl">
            {me ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-split">Your account</p>
                <h2 className="mt-1 text-xl font-extrabold">{me.name}</h2>
                <p className="text-sm text-muted">{me.phone}</p>
                <p className="mt-2 text-xs text-muted">This name goes on receipts when you pay at a table.</p>
                <button type="button" onClick={signOut} className="mt-4 w-full rounded-full bg-sand py-3 text-sm font-bold">
                  Log out
                </button>
                <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full py-2 text-sm font-semibold text-muted">
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-split">Diners</p>
                <h2 className="mt-1 text-xl font-extrabold">
                  {mode === "login" ? "Log in" : "Create an account"}
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-sand p-1 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`rounded-full py-2 ${mode === "login" ? "bg-white" : ""}`}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className={`rounded-full py-2 ${mode === "register" ? "bg-white" : ""}`}
                  >
                    Create account
                  </button>
                </div>
                {mode === "register" ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="mt-3 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                  />
                ) : null}
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                />
                {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit()}
                  className="mt-4 w-full rounded-full bg-split py-3 text-sm font-extrabold text-white disabled:opacity-40"
                >
                  {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full py-2 text-sm font-semibold text-muted">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function useDiner() {
  const [me, setMe] = useState<DinerPublic | null>(null);
  useEffect(() => {
    const token = readDinerToken();
    if (!token) return;
    fetch(`/api/account?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { me?: DinerPublic } | null) => {
        if (d?.me) setMe(d.me);
      })
      .catch(() => undefined);
  }, []);
  return me;
}
