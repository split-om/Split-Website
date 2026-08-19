import type { Metadata } from "next";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">About Split</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Restaurant payments, built for Oman
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Split is a Muscat-based hospitality payments company. We help cafés, restaurants, and hotels take faster
          payments, earn more tips, and collect more reviews — without replacing the POS they already trust.
        </p>
        <img src="/images/office.jpg" alt="" className="mt-12 h-[420px] w-full rounded-[2rem] object-cover" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { t: "Local", d: "Team, support, and settlement designed around Oman VAT, banks, and service culture." },
            { t: "POS-first", d: "We integrate rather than rip and replace. Your floor team keeps the workflow they know." },
            { t: "Guest-loved", d: "Scan, split, tip, pay. Ten seconds. No app required." },
          ].map((c) => (
            <article key={c.t} className="rounded-[1.6rem] bg-lilac p-6">
              <h3 className="text-lg font-extrabold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBanner title="Come build hospitality’s next checkout with us" />
    </>
  );
}
