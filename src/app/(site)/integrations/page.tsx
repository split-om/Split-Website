import type { Metadata } from "next";
import { integrations } from "@/lib/data";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  const pos = integrations.filter((i) => i.category === "POS");
  const pay = integrations.filter((i) => i.category === "Payments");

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Works with the stack you already run</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Split connects to leading POS platforms and the cards your guests already carry.
        </p>
        <h2 className="mt-12 text-2xl font-extrabold">POS</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {pos.map((i) => (
            <div key={i.name} className="rounded-2xl border border-line px-5 py-4 font-semibold">
              {i.name}
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-2xl font-extrabold">Payments</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {pay.map((i) => (
            <div key={i.name} className="rounded-2xl border border-line px-5 py-4 font-semibold">
              {i.name}
            </div>
          ))}
        </div>
      </section>
      <CtaBanner title="Don’t see your POS? Ask us." />
    </>
  );
}
