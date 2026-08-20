"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useStaff } from "./StaffGate";
import type { MenuItem } from "@/lib/menu";
import type { VenueProfile } from "@/lib/venue";

const CATS: MenuItem["category"][] = ["Drinks", "Food", "Sweets"];

export function MenuEditor({ venue }: { venue: VenueProfile }) {
  const { me, signOut, token } = useStaff();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/menu?venue=${encodeURIComponent(venue.slug)}`)
      .then((r) => r.json())
      .then((d: { items?: MenuItem[] }) => setItems(d.items ?? []))
      .catch(() => undefined);
  }, [venue.slug]);

  function add() {
    setItems((cur) => [
      ...cur,
      { id: `new${Date.now()}`, name: "", omr: 1, category: "Drinks" },
    ]);
  }

  function patch(id: string, next: Partial<MenuItem>) {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }

  async function uploadPhoto(id: string, file: File) {
    setMsg("");
    const data = new FormData();
    data.append("token", token);
    data.append("file", file);
    const res = await fetch("/api/menu/photo", { method: "POST", body: data });
    const json = (await res.json()) as { error?: string; url?: string };
    if (!res.ok || !json.url) {
      setMsg(json.error || "Could not add photo.");
      return;
    }
    patch(id, { photo: json.url });
    setMsg("Photo added. Tap Save menu so guests see it.");
  }

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, items }),
    });
    const data = (await res.json()) as { error?: string; items?: MenuItem[] };
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not save.");
      return;
    }
    if (data.items) setItems(data.items);
    setMsg("Saved. Guests see this on the table QR now.");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-[#f3f1f6]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-sm font-extrabold">Menu</p>
            <p className="text-[11px] text-muted">{venue.name} · {me.name}</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <Link href={`/venue/${venue.slug}`} className="rounded-full border border-line px-3 py-2">
            Floor
          </Link>
          {me.access.people ? (
            <Link href={`/venue/${venue.slug}/people`} className="rounded-full border border-line px-3 py-2">
              People
            </Link>
          ) : null}
          <button type="button" onClick={signOut} className="rounded-full px-3 py-2 text-muted">
            Sign out
          </button>
        </div>
      </header>

      <div className="p-4">
        <p className="text-sm text-muted">
          What guests see when they scan the table QR. Tap the square to add a photo of the dish.
        </p>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-[1.4rem] border border-line bg-white p-4">
              <div className="flex gap-3">
                <label className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-sand">
                  {item.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center px-1 text-center text-[10px] font-bold text-muted">
                      Add photo
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute inset-0 opacity-0"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhoto(item.id, file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_7rem]">
                    <input
                      value={item.name}
                      onChange={(e) => patch(item.id, { name: e.target.value })}
                      placeholder="Name"
                      className="rounded-xl border border-line px-3 py-2 text-sm font-semibold outline-none"
                    />
                    <input
                      inputMode="decimal"
                      value={item.omr}
                      onChange={(e) => patch(item.id, { omr: Number(e.target.value) || 0 })}
                      className="rounded-xl border border-line px-3 py-2 text-sm font-extrabold outline-none"
                    />
                  </div>
                  <input
                    value={item.detail ?? ""}
                    onChange={(e) => patch(item.id, { detail: e.target.value })}
                    placeholder="Detail (optional)"
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={item.category}
                      onChange={(e) => patch(item.id, { category: e.target.value as MenuItem["category"] })}
                      className="rounded-xl border border-line px-3 py-2 text-sm outline-none"
                    >
                      {CATS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    {item.photo ? (
                      <button
                        type="button"
                        onClick={() => patch(item.id, { photo: "" })}
                        className="text-xs font-bold text-muted"
                      >
                        Remove photo
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setItems((cur) => cur.filter((i) => i.id !== item.id))}
                      className="ml-auto text-xs font-bold text-red-500"
                    >
                      Remove dish
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={add} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold">
            Add dish
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-full bg-split px-5 py-2 text-sm font-extrabold text-white disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save menu"}
          </button>
        </div>
        {msg ? <p className="mt-3 text-sm font-semibold text-emerald-700">{msg}</p> : null}
      </div>
    </div>
  );
}
