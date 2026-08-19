import type { Metadata } from "next";
import { DemoForm } from "@/components/DemoForm";

export const metadata: Metadata = {
  title: "Get a Free Demo",
  description: "Book a Split demo for your restaurant in Oman.",
};

export default function DemoPage() {
  return (
    <section className="mx-auto grid max-w-7xl items-start gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Book a demo</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          See Split in action
        </h1>
        <p className="mt-4 text-lg text-muted">
          A specialist in Muscat will walk you through Pay-at-Table, Order-and-Pay, and how Split connects to your POS.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li>✓ Live walkthrough tailored to your venue type</li>
          <li>✓ Pricing for single sites and groups</li>
          <li>✓ Typical go-live in under two weeks</li>
        </ul>
        <img src="/images/office.jpg" alt="" className="mt-10 hidden h-72 w-full rounded-[2rem] object-cover lg:block" />
      </div>
      <div className="rounded-[2rem] border border-line p-6 sm:p-8">
        <DemoForm />
      </div>
    </section>
  );
}
