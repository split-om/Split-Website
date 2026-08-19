"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cities } from "@/lib/data";
import {
  emptyDraft,
  posCatalog,
  posPlan,
  products,
  sampleCafe,
  saveApplication,
  tableRanges,
  venueTypes,
} from "@/lib/join";

const STEPS = ["Venue", "Location", "Products", "You", "Review"];

export function JoinWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError("");
  }

  function toggleProduct(id: string) {
    setDraft((d) => ({
      ...d,
      products: d.products.includes(id) ? d.products.filter((p) => p !== id) : [...d.products, id],
    }));
  }

  function validate() {
    if (step === 0 && (!draft.venueType || !draft.venueName.trim())) {
      return "Choose a venue type and enter the name.";
    }
    if (step === 1 && !draft.city) return "Choose a city.";
    if (step === 2 && draft.products.length === 0) return "Pick at least one product.";
    if (step === 3) {
      if (!draft.firstName.trim() || !draft.lastName.trim()) return "Enter your name.";
      if (!draft.email.includes("@")) return "Enter a work email.";
      if (draft.phone.replace(/\D/g, "").length < 8) return "Enter a phone number.";
    }
    return "";
  }

  function next() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const app = saveApplication(draft);
    fetch("/api/hq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application: app }),
    }).catch(() => undefined);
    router.push(`/join/success?id=${app.id}`);
  }

  return (
    <div className="rounded-[2rem] border border-line bg-white p-6 sm:p-8">
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-split" : "bg-line"}`} />
            <p className={`mt-1 hidden text-[10px] font-bold uppercase tracking-wider sm:block ${i === step ? "text-split" : "text-muted"}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">What are you joining with?</h2>
          <p className="mt-1 text-sm text-muted">Restaurants and coffee shops use the same onboarding.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {venueTypes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => set("venueType", v.id)}
                className={`rounded-2xl border px-4 py-4 text-left ${
                  draft.venueType === v.id ? "border-split bg-lilac" : "border-line"
                }`}
              >
                <div className="font-extrabold">{v.label}</div>
                <div className="text-xs text-muted">{v.hint}</div>
              </button>
            ))}
          </div>
          <label className="mt-5 block text-sm">
            <span className="mb-1 block font-semibold">Venue name</span>
            <input
              value={draft.venueName}
              onChange={(e) => set("venueName", e.target.value)}
              placeholder="e.g. Qahwa Al Qurum"
              className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-semibold">Brand / group (optional)</span>
            <input
              value={draft.brandName}
              onChange={(e) => set("brandName", e.target.value)}
              placeholder="If you have more than one site"
              className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
            />
          </label>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">Where is the venue?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">City</span>
              <select
                value={draft.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-split"
              >
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Area</span>
              <input
                value={draft.area}
                onChange={(e) => set("area", e.target.value)}
                placeholder="Qurum, Mutrah, Al Mouj…"
                className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Tables / seats</span>
              <select
                value={draft.tables}
                onChange={(e) => set("tables", e.target.value)}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-split"
              >
                {tableRanges.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Number of locations</span>
              <input
                type="number"
                min={1}
                value={draft.locations}
                onChange={(e) => set("locations", e.target.value)}
                className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
              />
            </label>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">What do you want to launch?</h2>
          <p className="mt-1 text-sm text-muted">You can add more later. Pay-at-Table is the usual start.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                  draft.products.includes(p.id) ? "border-split bg-lilac text-split" : "border-line"
                }`}
              >
                {draft.products.includes(p.id) ? "✓ " : ""}
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-6 text-sm font-semibold">Which till / POS do you use?</p>
          <p className="text-xs text-muted">This decides how we connect. Inventory always stays in the POS.</p>
          <div className="mt-3 grid gap-2">
            {posCatalog.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set("pos", p.label)}
                className={`rounded-2xl border px-4 py-3 text-left ${
                  draft.pos === p.label ? "border-split bg-lilac" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold">{p.label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-split">
                    {p.mode === "api" ? "API" : p.mode === "tablet" ? "Tablet" : p.mode === "partner" ? "Partner" : "Later"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{p.headline}</p>
              </button>
            ))}
          </div>
          {draft.pos ? (
            <p className="mt-4 rounded-2xl bg-sand p-4 text-xs leading-5 text-muted">{posPlan(draft.pos).connect}</p>
          ) : null}
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">Who should we talk to?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="First name" value={draft.firstName} onChange={(v) => set("firstName", v)} />
            <Field label="Last name" value={draft.lastName} onChange={(v) => set("lastName", v)} />
            <Field label="Role" value={draft.role} onChange={(v) => set("role", v)} placeholder="Owner, GM, finance…" />
            <Field label="Phone" value={draft.phone} onChange={(v) => set("phone", v)} />
          </div>
          <div className="mt-3">
            <Field label="Work email" value={draft.email} onChange={(v) => set("email", v)} type="email" />
          </div>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-semibold">Anything we should know?</span>
            <textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
              placeholder="Peak times, current payment pain, go-live date…"
            />
          </label>
        </section>
      )}

      {step === 4 && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">Review your application</h2>
          <dl className="mt-5 space-y-2 rounded-[1.4rem] bg-sand p-5 text-sm">
            <Row k="Venue" v={`${draft.venueName} · ${venueTypes.find((v) => v.id === draft.venueType)?.label}`} />
            <Row k="Where" v={`${draft.area ? `${draft.area}, ` : ""}${draft.city}`} />
            <Row k="Size" v={`${draft.tables} tables · ${draft.locations} location(s)`} />
            <Row k="Products" v={draft.products.map((id) => products.find((p) => p.id === id)?.label).join(", ")} />
            <Row k="POS" v={`${draft.pos} — ${posPlan(draft.pos).headline}`} />
            <Row k="Contact" v={`${draft.firstName} ${draft.lastName} · ${draft.role}`} />
            <Row k="Email" v={draft.email} />
            <Row k="Phone" v={draft.phone} />
          </dl>
          <p className="mt-3 text-xs text-muted">
            This test save stays in your browser. A live venue would go to the Split team in Muscat next.
          </p>
        </section>
      )}

      {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="rounded-full border border-line px-5 py-3 text-sm font-bold">
            Back
          </button>
        ) : null}
        <button type="button" onClick={next} className="flex-1 rounded-full bg-split py-3 text-sm font-bold text-white">
          {step === STEPS.length - 1 ? "Submit application" : "Continue"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setDraft(sampleCafe);
          setError("");
        }}
        className="mt-3 w-full text-center text-xs font-semibold text-split"
      >
        Fill a sample café (Qahwa Al Qurum) to test faster
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
      />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}
