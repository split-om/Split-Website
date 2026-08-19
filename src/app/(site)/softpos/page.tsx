import type { Metadata } from "next";
import { ProductHero } from "@/components/ProductHero";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata: Metadata = {
  title: "SoftPOS Terminal",
  description: "Accept tap-to-pay on a phone or dedicated device. Split SoftPOS for Oman.",
};

export default function SoftposPage() {
  return (
    <>
      <ProductHero
        eyebrow="SoftPOS Terminal"
        title="A full terminal in your pocket"
        body="Accept contactless payments on a single device fully integrated with your POS — perfect for tables, counters, pop-ups, and beach clubs."
        image="/images/softpos.jpg"
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 md:grid-cols-3">
        {[
          { t: "Tap to pay", d: "Visa, Mastercard, Apple Pay, and Google Pay on one device." },
          { t: "POS synced", d: "Every tap posts back to the check — no double entry." },
          { t: "Events ready", d: "Take the terminal to the terrace, the beach, or a wedding tent." },
        ].map((c) => (
          <article key={c.t} className="rounded-[1.6rem] border border-line p-6">
            <h3 className="text-lg font-extrabold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted">{c.d}</p>
          </article>
        ))}
      </section>
      <CtaBanner title="Replace bulky terminals" />
    </>
  );
}
