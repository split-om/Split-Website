"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { solutions } from "@/lib/data";

const company = [
  { href: "/hq", label: "Split HQ" },
  { href: "/hq/pos", label: "POS lab" },
  { href: "/join", label: "Join Split" },
  { href: "/about", label: "About Split" },
  { href: "/contact", label: "Contact" },
  { href: "/demo", label: "Book a demo" },
];

export function Header() {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setOpen("solutions")}
            onMouseLeave={() => setOpen(null)}
          >
            <button className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-lilac">
              Solutions
              <Caret />
            </button>
            {open === "solutions" && (
              <div className="absolute left-0 top-full w-[420px] rounded-2xl border border-line bg-white p-3 shadow-xl shadow-split/5">
                {solutions.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="block rounded-xl px-3 py-2.5 hover:bg-lilac"
                  >
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-muted">{s.blurb}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/venue/qahwa" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-lilac">
            Venue console
          </Link>
          <Link href="/pay" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-lilac">
            Pay a bill
          </Link>
          <Link href="/success-stories" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-lilac">
            Success Stories
          </Link>
          <Link href="/integrations" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-lilac">
            Integrations
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setOpen("company")}
            onMouseLeave={() => setOpen(null)}
          >
            <button className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold hover:bg-lilac">
              Company
              <Caret />
            </button>
            {open === "company" && (
              <div className="absolute left-0 top-full w-52 rounded-2xl border border-line bg-white p-2 shadow-xl">
                {company.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-lilac"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
            🇴🇲 Oman
          </span>
          <Link
            href="/join"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-split"
          >
            Join Split
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
          onClick={() => setMobile((v) => !v)}
          aria-label="Menu"
        >
          <span className="text-xl">{mobile ? "×" : "☰"}</span>
        </button>
      </div>

      {mobile && (
        <div className="border-t border-line bg-white px-4 py-4 lg:hidden">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Solutions</p>
          {solutions.map((s) => (
            <Link key={s.href} href={s.href} onClick={() => setMobile(false)} className="block py-2 text-sm font-semibold">
              {s.title}
            </Link>
          ))}
          <Link href="/venue/qahwa" onClick={() => setMobile(false)} className="block py-2 text-sm font-semibold">
            Venue console
          </Link>
          <Link href="/pay" onClick={() => setMobile(false)} className="block py-2 text-sm font-semibold">
            Pay a bill
          </Link>
          <Link href="/success-stories" onClick={() => setMobile(false)} className="block py-2 text-sm font-semibold">
            Success Stories
          </Link>
          <Link href="/integrations" onClick={() => setMobile(false)} className="block py-2 text-sm font-semibold">
            Integrations
          </Link>
          {company.map((c) => (
            <Link key={c.href} href={c.href} onClick={() => setMobile(false)} className="block py-2 text-sm font-semibold">
              {c.label}
            </Link>
          ))}
          <Link
            href="/join"
            onClick={() => setMobile(false)}
            className="mt-3 block rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Join Split
          </Link>
        </div>
      )}
    </header>
  );
}

function Caret() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
