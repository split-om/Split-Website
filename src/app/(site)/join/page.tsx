import type { Metadata } from "next";
import Link from "next/link";
import { JoinWizard } from "@/components/join/JoinWizard";

export const metadata: Metadata = {
  title: "Join Split",
  description: "Onboard your restaurant or coffee shop to Split in Oman.",
};

export default function JoinPage() {
  return (
    <section className="mx-auto grid max-w-7xl items-start gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">For venues</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Join Split with your restaurant or café
        </h1>
        <p className="mt-4 text-lg text-muted">
          Walk through the same application a venue in Oman would send us. Takes a few minutes. You can use a sample
          café to test the full path.
        </p>
        <ol className="mt-8 space-y-4 text-sm">
          {[
            ["Tell us about the venue", "Restaurant, coffee shop, hotel, or cloud kitchen."],
            ["Tell us your POS", "Foodics connects now. No POS? We use a tablet bill. Inventory stays with them."],
            ["Connect and go live", "QR tents, payments, and a POS sandbox you can try today."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lilac text-xs font-extrabold text-split">
                {i + 1}
              </span>
              <span>
                <span className="font-extrabold">{t}</span>
                <span className="mt-0.5 block text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-muted">
          Already applied?{" "}
          <Link href="/join/applications" className="font-semibold text-split">
            View test applications →
          </Link>
        </p>
      </div>
      <JoinWizard />
    </section>
  );
}
