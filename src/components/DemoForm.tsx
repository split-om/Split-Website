"use client";

import { FormEvent, useState } from "react";
import { cities } from "@/lib/data";

export function DemoForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-line bg-lilac p-8 text-center">
        <div className="text-3xl">✓</div>
        <h3 className="mt-2 text-xl font-extrabold">You are on the list</h3>
        <p className="mt-2 text-sm text-muted">
          A Split specialist in Muscat will reach out within one business day to schedule your demo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <Field name="firstName" label="First name" required />
        <Field name="lastName" label="Last name" required />
      </div>
      <Field name="email" label="Work email" type="email" required />
      <Field name="phone" label="Phone" type="tel" placeholder="+968" required />
      <Field name="restaurant" label="Restaurant or hotel" required />
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">City</span>
          <select
            name="city"
            required
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-split"
            defaultValue="Muscat"
          >
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <Field name="locations" label="Locations" type="number" placeholder="1" />
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">How can we help?</span>
        <textarea
          name="message"
          rows={compact ? 3 : 4}
          className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
          placeholder="Tell us about your restaurant"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white hover:bg-split"
      >
        Get a Free Demo
      </button>
      <p className="text-center text-xs text-muted">
        100% secure. No commitment. Built for Oman hospitality.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-split"
      />
    </label>
  );
}
