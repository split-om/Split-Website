import Link from "next/link";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { LogoMarquee } from "@/components/LogoMarquee";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Testimonials } from "@/components/Testimonials";
import { CtaBanner } from "@/components/CtaBanner";
import { benefits, investors, press, solutions, stats, steps, stories } from "@/lib/data";

export default function Home() {
  const featured = solutions.filter((s) => s.featured);
  const rest = solutions.filter((s) => !s.featured);

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Ultra-Fast Restaurant
            <br />
            Payment Solutions
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            From boutique cafés in Mutrah to five-star hotels on the Corniche, Split powers seamless payment and
            operational experiences that guests and staff love.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pay" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-split">
              Scan, split, tip, pay
            </Link>
            <Link href="/join" className="rounded-full border border-line px-6 py-3 text-sm font-semibold hover:bg-lilac">
              Join as a venue
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted">
            <span>🔒 100% Secure Digital Payments</span>
            <span>🇴🇲 The #1 Choice for Restaurant Payment Solutions in Oman</span>
          </div>
        </div>
        <HeroSlideshow />
      </section>

      <LogoMarquee />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Featured solutions</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          Smart solutions tailored for every dining experience
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Whether it is dine-in, takeaway, or online orders, Split covers contactless payments, menus, and loyalty
          for Oman hospitality.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl bg-lilac px-6 py-5">
              <div className="text-3xl font-extrabold tracking-tight">{s.value.startsWith("16") ? "Save 16 min" : s.value.startsWith("300") ? "Earn 300%" : "Get 7X"}</div>
              <div className="text-sm text-muted">
                {s.label.replace("Saved ", "").replace("More ", "More ").replace("More Google reviews", "Positive Google Reviews")}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {featured.map((s, idx) => (
            <Link
              key={s.href}
              href={s.href}
              className="group grid items-center gap-6 rounded-[2rem] border border-line bg-sand p-6 sm:grid-cols-2 sm:p-8"
            >
              <div>
                <h3 className="text-2xl font-extrabold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.blurb}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-split group-hover:underline">
                  {s.cta} →
                </span>
              </div>
              <PhoneMockup screen={idx === 0 ? "bill" : "order"} className="scale-90" />
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((s) => (
            <Link key={s.href} href={s.href} className="rounded-[1.6rem] border border-line p-5 hover:bg-lilac">
              <div className="mb-4 overflow-hidden rounded-2xl">
                <img
                  src={
                    s.slug === "digital-menu"
                      ? "/images/food-spread.jpg"
                      : s.slug === "payment-links"
                        ? "/images/hero-4.jpg"
                        : s.slug === "softpos"
                          ? "/images/softpos.jpg"
                          : "/images/rewards.jpg"
                  }
                  alt=""
                  className="h-36 w-full object-cover"
                />
              </div>
              <h3 className="font-extrabold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.blurb}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-split">{s.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-sand py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Key benefits</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Smarter solutions,
            <br />
            better vibes
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Supercharge your restaurant with seamless operations, happier customers, and increased revenue. From
            contactless payments to real-time menu updates, Split is designed for Oman.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {benefits.map((b) => (
              <article key={b.title} className="overflow-hidden rounded-[2rem] bg-white">
                <img src={b.image} alt="" className="h-56 w-full object-cover" />
                <div className="p-7">
                  <h3 className="text-2xl font-extrabold tracking-tight">{b.title}</h3>
                  <p className="mt-3 text-muted">{b.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Get started in 3 simple steps</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Sign up. Get set. Start serving.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-[2rem] border border-line p-7">
              <div className="text-sm font-extrabold text-split">{s.n}</div>
              <h3 className="mt-3 text-xl font-extrabold">{s.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <Link href="/demo" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-split">
          Get started with a free demo
        </Link>
      </section>

      <Testimonials />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Success stories</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Real results from real restaurants</h2>
          <Link href="/success-stories" className="hidden text-sm font-semibold text-split sm:inline">
            Read all stories →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {stories.map((st) => (
            <Link key={st.slug} href={`/success-stories/${st.slug}`} className="group overflow-hidden rounded-[2rem] border border-line">
              <img src={st.image} alt="" className="h-64 w-full object-cover transition group-hover:scale-[1.03]" />
              <div className="p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-split">{st.city}</div>
                <h3 className="mt-1 text-xl font-extrabold">{st.name}</h3>
                <p className="mt-2 text-sm text-muted">{st.summary}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-split">Explore more →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaBanner />

      <section className="border-t border-line py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h3 className="text-center text-xl font-extrabold">Backed by</h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted">
            Proudly supported by partners who believe in better restaurant technology for Oman.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {investors.map((n) => (
              <span key={n} className="text-sm font-extrabold tracking-tight text-ink/40">
                {n}
              </span>
            ))}
          </div>
          <h3 className="mt-14 text-center text-xl font-extrabold">As seen on</h3>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {press.map((n) => (
              <span key={n} className="text-sm font-extrabold tracking-tight text-ink/40">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
