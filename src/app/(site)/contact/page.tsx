import type { Metadata } from "next";
import { DemoForm } from "@/components/DemoForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Talk to Split</h1>
        <p className="mt-4 text-muted">
          Whether you run a café in Mutrah or a hotel group in Muscat, we would love to hear from you.
        </p>
        <div className="mt-8 space-y-4 text-sm">
          <p>
            <strong>Sales</strong>
            <br />
            sales@split.om
            <br />
            +968 24 000 000
          </p>
          <p>
            <strong>Support</strong>
            <br />
            hello@split.om
          </p>
          <p>
            <strong>Studio</strong>
            <br />
            Al Khuwair, Muscat
            <br />
            Sultanate of Oman
          </p>
        </div>
      </div>
      <div className="rounded-[2rem] border border-line p-6 sm:p-8">
        <DemoForm compact />
      </div>
    </section>
  );
}
