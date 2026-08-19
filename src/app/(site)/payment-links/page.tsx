import type { Metadata } from "next";
import { ProductHero } from "@/components/ProductHero";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata: Metadata = {
  title: "Payment Links",
  description: "Secure payment links for catering, events, and reservations in Oman.",
};

export default function PaymentLinksPage() {
  return (
    <>
      <ProductHero
        eyebrow="Payment Links"
        title="Get paid before the event starts"
        body="Send secure payment links for catering orders, reservations, deposits, and private dining — collect OMR instantly on WhatsApp, email, or SMS."
        screen="pay"
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 md:grid-cols-3">
        {[
          { t: "Deposits", d: "Lock in weekend bookings with a tap-to-pay deposit." },
          { t: "Catering", d: "Invoice corporate lunches and weddings without chasing cheques." },
          { t: "Private dining", d: "Collect the balance before guests arrive." },
        ].map((c) => (
          <article key={c.t} className="rounded-[1.6rem] bg-sand p-6">
            <h3 className="text-lg font-extrabold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted">{c.d}</p>
          </article>
        ))}
      </section>
      <CtaBanner />
    </>
  );
}
