"use client";

import { useState } from "react";
import Link from "next/link";

export function PromoBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#7c3aed] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <p className="text-sm font-medium">
          Start your 30-day free{" "}
          <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-extrabold tracking-tight">
            Split+
          </span>{" "}
          trial — exclusive dining offers from restaurants across Oman
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/rewards"
            className="hidden rounded-full bg-white px-3 py-1 text-xs font-semibold text-split sm:inline-block"
          >
            Sign up now
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-full text-white/80 hover:bg-white/10"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
