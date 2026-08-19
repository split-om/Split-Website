import type { Metadata } from "next";
import { ProductHero } from "@/components/ProductHero";
import { CtaBanner } from "@/components/CtaBanner";
import { LogoMarquee } from "@/components/LogoMarquee";

export const metadata: Metadata = {
  title: "Order-and-Pay",
  description: "Browse, order, and pay from the phone. Split Order-and-Pay for Oman restaurants.",
};

export default function OrderAndPayPage() {
  return (
    <>
      <ProductHero
        eyebrow="Order-and-Pay"
        title="Browse, order, and pay from the table"
        body="Empower diners to explore your menu, send orders to the kitchen, and settle the bill on their own phone — perfect for casual dining, cafés, and busy lunch rooms across Oman."
        screen="order"
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
        {[
          { t: "No app download", d: "Guests scan a QR and start ordering in the browser." },
          { t: "Kitchen-ready tickets", d: "Orders flow to your POS or KDS with modifiers intact." },
          { t: "Pay at any moment", d: "Add items throughout the meal and pay when ready." },
        ].map((c) => (
          <article key={c.t} className="rounded-[1.6rem] bg-lilac p-6">
            <h3 className="text-lg font-extrabold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted">{c.d}</p>
          </article>
        ))}
      </section>
      <LogoMarquee />
      <CtaBanner title="Let guests order on their terms" />
    </>
  );
}
