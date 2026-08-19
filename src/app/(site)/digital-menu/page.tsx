import type { Metadata } from "next";
import { ProductHero } from "@/components/ProductHero";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata: Metadata = {
  title: "Digital Menu",
  description: "Real-time digital menus for restaurants in Oman.",
};

export default function DigitalMenuPage() {
  return (
    <>
      <ProductHero
        eyebrow="Digital Menu"
        title="A living menu on every phone"
        body="Offer sleek, real-time menus that diners can browse digitally — update prices, 86 items, and highlight specials instantly, in English and Arabic."
        screen="menu"
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <img src="/images/food-spread.jpg" alt="" className="mb-10 h-80 w-full rounded-[2rem] object-cover" />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t: "Always current", d: "Change prices and availability without reprinting." },
            { t: "Beautiful photos", d: "Showcase dishes the way your kitchen intended." },
            { t: "Bilingual ready", d: "Present menus in English and Arabic for every guest." },
          ].map((c) => (
            <article key={c.t} className="rounded-[1.6rem] border border-line p-6">
              <h3 className="text-lg font-extrabold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBanner title="Go paperless without losing the theatre of the table" />
    </>
  );
}
