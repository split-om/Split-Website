import Link from "next/link";
import { PhoneMockup } from "./PhoneMockup";

export function ProductHero({
  eyebrow,
  title,
  body,
  screen,
  image,
  primaryHref = "/demo",
  primaryLabel = "Get a Free Demo",
}: {
  eyebrow: string;
  title: string;
  body: string;
  screen?: "bill" | "split" | "tip" | "pay" | "menu" | "order" | "review" | "rewards";
  image?: string;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={primaryHref} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-split">
            {primaryLabel}
          </Link>
          {primaryHref !== "/demo" ? (
            <Link href="/demo" className="rounded-full border border-line px-6 py-3 text-sm font-semibold hover:bg-lilac">
              Get a Free Demo
            </Link>
          ) : null}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted">
          <span>🔒 100% Secure Digital Payments</span>
          <span>🇴🇲 Built for restaurants in Oman</span>
        </div>
      </div>
      {image ? (
        <img src={image} alt="" className="w-full rounded-[2rem] object-cover" />
      ) : (
        <PhoneMockup screen={screen ?? "bill"} />
      )}
    </section>
  );
}
