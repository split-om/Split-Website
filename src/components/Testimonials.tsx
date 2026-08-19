"use client";

import { useState } from "react";
import { stats, testimonials } from "@/lib/data";

export function Testimonials() {
  const [i, setI] = useState(0);
  const t = testimonials[i];

  return (
    <section className="bg-lilac py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Customer testimonials</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          Join restaurant and hotel owners who have transformed operations with Split
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl bg-white p-6">
              <div className="text-3xl font-extrabold tracking-tight">{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-[2rem] bg-white p-8 sm:p-12">
          <p className="max-w-3xl text-2xl font-semibold leading-snug tracking-tight">“{t.quote}”</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-extrabold">{t.name}</div>
              <div className="text-sm text-muted">
                {t.role} · {t.venue}
              </div>
            </div>
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  className={`h-2.5 w-8 rounded-full ${idx === i ? "bg-split" : "bg-line"}`}
                  aria-label={`Testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
