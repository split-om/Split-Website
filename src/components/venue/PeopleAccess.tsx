"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useStaff } from "./StaffGate";
import { ACCESS_KEYS, WAITER_ACCESS, type StaffAccess, type StaffPublic } from "@/lib/staff-types";
import type { VenueProfile } from "@/lib/venue";

export function PeopleAccess({ venue }: { venue: VenueProfile }) {
  const { me, signOut, token } = useStaff();
  const [people, setPeople] = useState<StaffPublic[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [access, setAccess] = useState<StaffAccess>(WAITER_ACCESS);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/staff?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d: { people?: StaffPublic[] }) => setPeople(d.people ?? []))
      .catch(() => undefined);
  }

  useEffect(load, [token]);

  function toggle(id: string, key: keyof StaffAccess, value: boolean) {
    const person = people.find((p) => p.id === id);
    if (!person) return;
    save({ id, name: person.name, access: { ...person.access, [key]: value } });
  }

  async function save(body: { id?: string; name: string; password?: string; access: StaffAccess }) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", token, ...body }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not save.");
      return;
    }
    setMsg("Saved.");
    setName("");
    setPassword("");
    setAccess(WAITER_ACCESS);
    load();
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", token, id }),
    });
    setBusy(false);
    load();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-[#f3f1f6]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-sm font-extrabold">People & access</p>
            <p className="text-[11px] text-muted">{venue.name} · {me.name}</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <Link href={`/venue/${venue.slug}`} className="rounded-full border border-line px-3 py-2">
            Floor
          </Link>
          {me.access.menu ? (
            <Link href={`/venue/${venue.slug}/menu`} className="rounded-full border border-line px-3 py-2">
              Menu
            </Link>
          ) : null}
          <button type="button" onClick={signOut} className="rounded-full px-3 py-2 text-muted">
            Sign out
          </button>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <p className="text-sm text-muted">
          Only people you add can open the staff tablet. Tick what each person is allowed to do.
        </p>

        {people.map((p) => (
          <article key={p.id} className="rounded-[1.4rem] border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-extrabold">{p.name}</p>
                <p className="text-[11px] text-muted">{p.locked ? "Owner — cannot be removed" : "Staff"}</p>
              </div>
              {!p.locked ? (
                <button type="button" onClick={() => remove(p.id)} className="text-xs font-bold text-red-500">
                  Remove
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ACCESS_KEYS.map((a) => (
                <label key={a.key} className="flex items-start gap-2 rounded-xl bg-sand px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.access[a.key]}
                    disabled={Boolean(p.locked && (a.key === "people" || a.key === "menu"))}
                    onChange={(e) => toggle(p.id, a.key, e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-bold">{a.label}</span>
                    <span className="block text-[11px] text-muted">{a.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </article>
        ))}

        <form
          className="rounded-[1.4rem] border border-dashed border-split/40 bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            save({ name, password, access });
          }}
        >
          <p className="font-extrabold">Add a person</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ACCESS_KEYS.map((a) => (
              <label key={a.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={access[a.key]}
                  onChange={(e) => setAccess((c) => ({ ...c, [a.key]: e.target.checked }))}
                />
                {a.label}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-full bg-split px-5 py-2 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Add
          </button>
        </form>
        {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
      </div>
    </div>
  );
}
