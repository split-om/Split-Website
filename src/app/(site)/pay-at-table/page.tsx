import type { Metadata } from "next";
import { ProductHero } from "@/components/ProductHero";
import { PhoneMockup } from "@/components/PhoneMockup";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Testimonials } from "@/components/Testimonials";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata: Metadata = {
  title: "Pay-at-Table",
  description: "Scan, split, tip, and pay in seconds. Split Pay-at-Table for restaurants in Oman.",
};

const flow = [
  { t: "Scan", d: "Scan the QR code to instantly retrieve the bill — no waiting, no hassle.", s: "bill" as const },
  { t: "Split", d: "Choose how to split the bill — equally, by item, or by custom amount.", s: "split" as const },
  { t: "Tip", d: "Built-in digital tipping prompts help increase staff earnings by up to 3×.", s: "tip" as const },
  { t: "Pay", d: "Complete payment in about 10 seconds with Apple Pay, Google Pay, and cards.", s: "pay" as const },
  { t: "Review", d: "Prompt glowing Google reviews while the experience is still fresh.", s: "review" as const },
];

const extras = [
  { t: "Elevate guest experience", d: "Let guests pay when they are ready — no waiting for the bill." },
  { t: "Save time, serve more", d: "Save up to 16 minutes per table and turn more covers each night." },
  { t: "Boost tips by 3×", d: "Digital tipping makes it easy for guests to reward great service." },
  { t: "Streamline operations", d: "POS-synced bills mean fewer mistakes and faster settlement." },
  { t: "Drive positive feedback", d: "See up to 7× more Google reviews after every meal." },
];

export default function PayAtTablePage() {
  return (
    <>
      <ProductHero
        eyebrow="Pay-at-Table"
        title="Scan, Split, Tip, Pay"
        body="Revolutionise guest payments with a fast, secure Pay-at-Table solution linked to your POS — a seamless 10-second checkout that boosts tips and digital convenience."
        screen="bill"
        primaryHref="/pay"
        primaryLabel="Try it now — pay a table"
      />
      <section className="bg-sand py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Scan, split, tip, and pay.
            <br />
            It is that easy.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {flow.map((f) => (
              <div key={f.t} className="flex flex-col">
                <div className="mb-4 h-[360px] overflow-hidden">
                  <PhoneMockup screen={f.s} className="origin-top scale-[0.68]" />
                </div>
                <h3 className="text-lg font-extrabold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <LogoMarquee />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Transform payments with Pay-at-Table</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {extras.map((e) => (
            <article key={e.t} className="rounded-[1.6rem] border border-line p-6">
              <h3 className="text-lg font-extrabold">{e.t}</h3>
              <p className="mt-2 text-sm text-muted">{e.d}</p>
            </article>
          ))}
        </div>
      </section>
      <Testimonials />
      <CtaBanner title="Scan, Split, Tip, Pay" body="Enhance your restaurant with a hassle-free Pay-at-Table solution — smoother payments, happier guests, and a more efficient floor team." />
    </>
  );
}
