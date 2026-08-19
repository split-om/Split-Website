import type { Metadata } from "next";
import { ProductHero } from "@/components/ProductHero";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata: Metadata = {
  title: "Split+ Rewards",
  description: "A dining rewards program for guests and restaurants in Oman.",
};

export default function RewardsPage() {
  return (
    <>
      <ProductHero
        eyebrow="Split+ Rewards"
        title="Give guests a reason to come back"
        body="Split+ is a 30-day free trial rewards layer — exclusive dining offers from restaurants across Oman, and a simple way for venues to fill midweek seats."
        screen="rewards"
      />
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <img src="/images/rewards.jpg" alt="" className="h-80 w-full rounded-[2rem] object-cover" />
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 md:grid-cols-3">
        {[
          { t: "For diners", d: "Unlock offers at 80+ restaurants after you pay with Split." },
          { t: "For restaurants", d: "Fill quiet hours with targeted offers, not blanket discounts." },
          { t: "30-day trial", d: "Launch Split+ with your venue at no extra setup cost." },
        ].map((c) => (
          <article key={c.t} className="rounded-[1.6rem] bg-lilac p-6">
            <h3 className="text-lg font-extrabold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted">{c.d}</p>
          </article>
        ))}
      </section>
      <CtaBanner title="Start your 30-day Split+ trial" />
    </>
  );
}
